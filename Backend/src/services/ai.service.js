const { GoogleGenAI } = require("@google/genai")
const { marked } = require("marked")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

const interviewReportJsonSchema = {
    type: "object",
    properties: {
        title: { type: "string", description: "The title of the job for which the interview report is generated" },
        matchScore: { type: "number", description: "A score between 0 and 100 indicating how well the candidate's profile matches the job description" },
        technicalQuestions: {
            type: "array",
            description: "Technical questions that can be asked in the interview along with their intention and how to answer them",
            items: {
                type: "object",
                properties: {
                    question: { type: "string", description: "The technical question that can be asked in the interview" },
                    intention: { type: "string", description: "The intention of the interviewer behind asking this question" },
                    answer: { type: "string", description: "How to answer this question, what points to cover, what approach to take etc." }
                },
                required: [ "question", "intention", "answer" ]
            }
        },
        behavioralQuestions: {
            type: "array",
            description: "Behavioral questions that can be asked in the interview along with their intention and how to answer them",
            items: {
                type: "object",
                properties: {
                    question: { type: "string", description: "The behavioral question that can be asked in the interview" },
                    intention: { type: "string", description: "The intention of the interviewer behind asking this question" },
                    answer: { type: "string", description: "How to answer this question, what points to cover, what approach to take etc." }
                },
                required: [ "question", "intention", "answer" ]
            }
        },
        skillGaps: {
            type: "array",
            description: "List of skill gaps in the candidate's profile along with their severity",
            items: {
                type: "object",
                properties: {
                    skill: { type: "string", description: "The skill which the candidate is lacking" },
                    severity: { type: "string", enum: [ "low", "medium", "high" ], description: "The severity of this skill gap" }
                },
                required: [ "skill", "severity" ]
            }
        },
        preparationPlan: {
            type: "array",
            description: "A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively",
            items: {
                type: "object",
                properties: {
                    day: { type: "number", description: "The day number in the preparation plan, starting from 1" },
                    focus: { type: "string", description: "The main focus of this day in the preparation plan" },
                    tasks: {
                        type: "array",
                        items: { type: "string" },
                        description: "List of tasks to be done on this day"
                    }
                },
                required: [ "day", "focus", "tasks" ]
            }
        }
    },
    required: [ "title", "matchScore", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan" ]
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: interviewReportJsonSchema,
        }
    })

    return JSON.parse(response.text)
}


// ─────────────────────────────────────────────────────────────────────────
// Resume tailoring (edits the existing resume, does not invent a new one)
// ─────────────────────────────────────────────────────────────────────────

const RESUME_TEMPLATE = `@REDACTED=false
@NAME=<candidate's real full name from the resume>||Hidden Name
@EMAIL=<candidate's real email from the resume>||fake@email.com
@PHONE=<candidate's real phone from the resume>||123-456-fake
@LINKEDIN=<candidate's real linkedin username from the resume>||linkedin.com/in/fake

# {NAME}

<div class="section headerInfo">

- {PHONE}
- [{EMAIL}](mailto:{EMAIL})
- [linkedin.com/in/{LINKEDIN}](https://www.linkedin.com/in/{LINKEDIN})

</div>

## Education

### <Institute Name> <span class="spacer"></span><span class="normal"><Start – End Dates></span>
#### <Degree Title> <span class="spacer"></span> <Location>

## Experience

### <Role Title> <span class="tech-stack">&nbsp;| <Company Name></span><span class="spacer"></span><span class="normal"><Start – End Dates></span>

- <bullet point>
- <bullet point>

## Technical Skills

<span class="indent"></span><span style="display:inline-block; width:165px;"><b>Category:</b></span> skill, skill, skill<br>

## Projects

### <Project Name> | <Tech Stack Used><span class="normal"><Year></span>

- <bullet point>

## Relevant Coursework

<course> • <course> • <course>

## Activities

- <achievement / activity bullet>
`

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const prompt = `You are an expert resume editor. You will EDIT the candidate's EXISTING resume below to better target a specific job — you must NOT invent a brand-new resume from scratch.

STRICT RULES:
1. Preserve the candidate's REAL name, email, phone, LinkedIn, education institutions, dates, work experience, achievements, and certifications EXACTLY as given in the original resume. Do not fabricate, rename, or replace any of these with placeholders, examples, or fictional data.
2. You MAY: reword bullet points for clarity and impact, reorder content, add relevant keywords/skills that genuinely match the job description if the candidate's background supports them, and REMOVE content that is clearly irrelevant to the target job.
3. You MUST NOT: change dates, invent new companies/projects/roles that aren't in the original resume, or alter factual achievements/certifications.
4. Output ONLY plain text following the EXACT template structure below — no markdown code fences, no extra commentary, nothing before or after it.
5. For the "||" fields in the header directives (@NAME, @EMAIL, @PHONE, @LINKEDIN): put the candidate's REAL extracted value before "||", and keep a generic fake placeholder after "||" exactly as shown in the template (these are used for an optional redaction toggle and are not up to you to change).
6. If a real value genuinely cannot be found anywhere in the original resume (e.g. no LinkedIn present), use an empty string before "||" for that field only.
7. Fill in every <angle-bracket> placeholder in the body with real content adapted from the original resume — remove any section entirely (e.g. Projects, Coursework) if the original resume has nothing relevant for it, rather than inventing content.

Original Resume:
${resume}

Candidate Self Description (may be empty):
${selfDescription}

Target Job Description:
${jobDescription}

Template to follow exactly (replace all placeholders, keep the structural markdown/HTML intact):
${RESUME_TEMPLATE}
`

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
    })

    console.log("RAW RESUME MARKDOWN:", response.text)   // remove once confirmed working

    const html = renderResumeMarkdownToHtml(response.text)
    const pdfBuffer = await generatePdfFromHtml(html)

    return pdfBuffer
}

/**
 * Parses the custom "@KEY=real||fake" directive format + {PLACEHOLDER} substitution,
 * then converts the remaining markdown body into a styled HTML document.
 */
function renderResumeMarkdownToHtml(rawText) {
    const lines = rawText.trim().split("\n")

    const variables = {}
    let redacted = false
    let bodyStartIndex = 0

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()

        if (line.startsWith("@REDACTED=")) {
            redacted = line.split("=")[1].trim().toLowerCase() === "true"
            bodyStartIndex = i + 1
            continue
        }

        const match = line.match(/^@([A-Z]+)=(.*)$/)
        if (match) {
            const key = match[1]
            const [realValue, fakeValue] = match[2].split("||").map(v => (v || "").trim())
            variables[key] = redacted ? (fakeValue || "") : (realValue || "")
            bodyStartIndex = i + 1
            continue
        }

        if (line !== "") break
    }

    let body = lines.slice(bodyStartIndex).join("\n")

    for (const [key, value] of Object.entries(variables)) {
        const pattern = new RegExp(`\\{${key}\\}`, "g")
        body = body.replace(pattern, value)
    }

    const bodyHtml = marked.parse(body)

    return `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8" />
        <style>
            * { box-sizing: border-box; }
            body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                color: #1a1f27;
                font-size: 11px;
                line-height: 1.45;
                max-width: 720px;
                margin: 0 auto;
                padding: 0 8px;
            }
            h1 {
                text-align: center;
                font-size: 22px;
                margin: 0 0 6px;
                letter-spacing: 0.5px;
            }
            h2 {
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border-bottom: 1.5px solid #1a1f27;
                padding-bottom: 2px;
                margin: 16px 0 8px;
            }
            h3 {
                display: flex;
                font-size: 12px;
                margin: 10px 0 2px;
                font-weight: 700;
            }
            h4 {
                display: flex;
                font-size: 11px;
                font-weight: 500;
                font-style: italic;
                margin: 0 0 4px;
                color: #333;
            }
            .spacer { flex: 1; }
            .normal { font-weight: 400; font-style: normal; color: #444; white-space: nowrap; }
            .tech-stack { font-weight: 400; font-style: italic; color: #444; }
            .indent { margin-left: 4px; }
            .headerInfo {
                text-align: center;
                margin-bottom: 4px;
            }
            .headerInfo ul {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                justify-content: center;
                gap: 6px;
                flex-wrap: wrap;
                font-size: 10.5px;
            }
            .headerInfo li:not(:last-child)::after {
                content: "|";
                margin-left: 6px;
                color: #999;
            }
            .headerInfo a { color: #1a1f27; text-decoration: none; }
            ul { margin: 2px 0 8px; padding-left: 16px; }
            li { margin-bottom: 2px; }
            p { margin: 4px 0; }
        </style>
        </head>
        <body>
            ${bodyHtml}
        </body>
        </html>
    `
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "16mm",
            bottom: "16mm",
            left: "14mm",
            right: "14mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

module.exports = { generateInterviewReport, generateResumePdf }