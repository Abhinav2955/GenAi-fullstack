const { GoogleGenAI } = require("@google/genai")
const { marked } = require("marked")
const puppeteer = require("puppeteer")
const env = require("../config/env")

const ai = new GoogleGenAI({
    apiKey: env.GOOGLE_GENAI_API_KEY,
})


// ─────────────────────────────────────────────────────────────────────────
// Retry helper for temporary Gemini errors
// Handles 429 / 503 / temporary unavailability
// ─────────────────────────────────────────────────────────────────────────

const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms))

function isRetryableGeminiError(error) {
    const status = error?.status

    const message =
        error?.message?.toLowerCase() || ""

    return (
        status === 429 ||
        status === 503 ||
        message.includes("high demand") ||
        message.includes("unavailable") ||
        message.includes("resource_exhausted") ||
        message.includes("too many requests")
    )
}

async function generateWithRetry(
    operation,
    maxRetries = 3
) {
    let lastError

    for (
        let attempt = 0;
        attempt <= maxRetries;
        attempt++
    ) {
        try {
            return await operation()
        } catch (error) {
            lastError = error

            if (
                !isRetryableGeminiError(error) ||
                attempt === maxRetries
            ) {
                throw error
            }

            const delay =
                1500 * Math.pow(2, attempt)

            console.warn(
                `Gemini temporarily unavailable. Retry ${attempt + 1}/${maxRetries} in ${delay}ms...`
            )

            await sleep(delay)
        }
    }

    throw lastError
}


// ─────────────────────────────────────────────────────────────────────────
// Interview report schema
// ─────────────────────────────────────────────────────────────────────────

const interviewReportJsonSchema = {
    type: "object",

    properties: {
        title: {
            type: "string",
        },

        technicalQuestions: {
            type: "array",

            items: {
                type: "object",

                properties: {
                    question: {
                        type: "string",
                    },

                    intention: {
                        type: "string",
                    },

                    answer: {
                        type: "string",
                    },
                },

                required: [
                    "question",
                    "intention",
                    "answer",
                ],
            },
        },

        behavioralQuestions: {
            type: "array",

            items: {
                type: "object",

                properties: {
                    question: {
                        type: "string",
                    },

                    intention: {
                        type: "string",
                    },

                    answer: {
                        type: "string",
                    },
                },

                required: [
                    "question",
                    "intention",
                    "answer",
                ],
            },
        },

        preparationPlan: {
            type: "array",

            items: {
                type: "object",

                properties: {
                    day: {
                        type: "number",
                    },

                    focus: {
                        type: "string",
                    },

                    tasks: {
                        type: "array",

                        items: {
                            type: "string",
                        },
                    },
                },

                required: [
                    "day",
                    "focus",
                    "tasks",
                ],
            },
        },
    },

    required: [
        "title",
        "technicalQuestions",
        "behavioralQuestions",
        "preparationPlan",
    ],
}


// ─────────────────────────────────────────────────────────────────────────
// Interview report generation
// ─────────────────────────────────────────────────────────────────────────

async function generateInterviewReport({
    resume,
    selfDescription,
    jobDescription,
    matchedSkills,
    missingSkills,
}) {
    const prompt = `
Act as a software-engineering interview coach.

Generate a focused interview plan using only the candidate information provided.

Do not invent experience or skills.

Resume:
${resume}

Self description:
${selfDescription || "Not provided"}

Job description:
${jobDescription}

Matched skills from deterministic analysis:
${matchedSkills.join(", ") || "none detected"}

Missing skills from deterministic analysis:
${missingSkills.join(", ") || "none detected"}

Return concise technical questions, behavioral questions, and a practical 7-day preparation plan.

The match percentage is calculated by the application and MUST NOT be generated by you.
`

    const response =
        await generateWithRetry(() =>
            ai.models.generateContent({
                model: env.GEMINI_MODEL,

                contents: prompt,

                config: {
                    responseMimeType:
                        "application/json",

                    responseSchema:
                        interviewReportJsonSchema,
                },
            })
        )

    if (!response?.text) {
        throw new Error(
            "Gemini returned an empty interview report response."
        )
    }

    return JSON.parse(response.text)
}


// ─────────────────────────────────────────────────────────────────────────
// Embeddings
// ─────────────────────────────────────────────────────────────────────────

async function getEmbedding(
    text,
    taskType = "SEMANTIC_SIMILARITY"
) {
    if (!text || !text.trim()) {
        return []
    }

    const response =
        await generateWithRetry(() =>
            ai.models.embedContent({
                model: env.EMBEDDING_MODEL,

                contents:
                    text.slice(0, 12000),

                config: {
                    outputDimensionality: 768,
                    taskType,
                },
            })
        )

    return (
        response.embeddings?.[0]?.values ||
        []
    )
}


// ─────────────────────────────────────────────────────────────────────────
// RAG assistant
// ─────────────────────────────────────────────────────────────────────────

async function generateRagAnswer({
    question,
    context,
    jobTitle,
}) {
    const prompt = `
You are a grounded interview-preparation assistant for the role "${jobTitle}".

Answer the user's question using ONLY the retrieved context below.

If the context does not support a claim about the candidate, clearly say that the available resume or job-description context does not provide enough information.

Do NOT invent:

- skills
- experience
- projects
- qualifications
- achievements

Retrieved context:

${context}

User question:

${question}

Give a concise and practical answer.

When useful, clearly distinguish:

1. What is present in the candidate's resume
2. What the job requires
3. What is missing
4. What the candidate should improve
`

    try {
        const response =
            await generateWithRetry(() =>
                ai.models.generateContent({
                    model:
                        env.GEMINI_MODEL,

                    contents:
                        prompt,
                })
            )

        if (!response?.text) {
            throw new Error(
                "Gemini returned an empty RAG response."
            )
        }

        return response.text
    } catch (error) {
        console.error(
            "RAG Gemini generation failed:",
            {
                status:
                    error?.status,

                message:
                    error?.message,
            }
        )

        throw error
    }
}


// ─────────────────────────────────────────────────────────────────────────
// Resume tailoring
// Edits the existing resume and does not invent a new one
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


// ─────────────────────────────────────────────────────────────────────────
// Resume PDF generation
// ─────────────────────────────────────────────────────────────────────────

async function generateResumePdf({
    resume,
    selfDescription,
    jobDescription,
}) {
    const prompt = `
You are an expert resume editor.

You will EDIT the candidate's EXISTING resume below to better target a specific job.

You must NOT invent a brand-new resume from scratch.

STRICT RULES:

1. Preserve the candidate's REAL name, email, phone, LinkedIn, education institutions, dates, work experience, achievements, and certifications EXACTLY as given in the original resume.

2. You MAY:
- reword bullet points for clarity and impact
- reorder content
- add relevant keywords/skills that genuinely match the job description if the candidate's background supports them
- remove content that is clearly irrelevant to the target job

3. You MUST NOT:
- change dates
- invent new companies
- invent new projects
- invent new roles
- alter factual achievements
- alter certifications

4. Output ONLY plain text following the EXACT template structure below.

5. Do not output markdown code fences.

6. Do not output extra commentary.

7. For the "||" fields in the header directives:

@NAME
@EMAIL
@PHONE
@LINKEDIN

put the candidate's REAL extracted value before "||"

and keep a generic fake placeholder after "||" exactly as shown in the template.

8. If a real value genuinely cannot be found anywhere in the original resume, use an empty string before "||" for that field only.

9. Fill in every <angle-bracket> placeholder in the body with real content adapted from the original resume.

10. Remove any section entirely if the original resume has nothing relevant for it rather than inventing content.

Original Resume:

${resume}

Candidate Self Description:

${selfDescription || "Not provided"}

Target Job Description:

${jobDescription}

Template to follow exactly:

${RESUME_TEMPLATE}
`

    const response =
        await generateWithRetry(() =>
            ai.models.generateContent({
                model:
                    env.GEMINI_MODEL,

                contents:
                    prompt,
            })
        )

    if (!response?.text) {
        throw new Error(
            "Gemini returned an empty resume response."
        )
    }

    const html =
        renderResumeMarkdownToHtml(
            response.text
        )

    const pdfBuffer =
        await generatePdfFromHtml(
            html
        )

    return pdfBuffer
}


// ─────────────────────────────────────────────────────────────────────────
// Resume markdown -> HTML
// ─────────────────────────────────────────────────────────────────────────

function renderResumeMarkdownToHtml(
    rawText
) {
    const lines =
        rawText
            .trim()
            .split("\n")

    const variables = {}

    let redacted =
        false

    let bodyStartIndex =
        0

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {
        const line =
            lines[i].trim()

        if (
            line.startsWith(
                "@REDACTED="
            )
        ) {
            redacted =
                line
                    .split("=")[1]
                    .trim()
                    .toLowerCase() ===
                "true"

            bodyStartIndex =
                i + 1

            continue
        }

        const match =
            line.match(
                /^@([A-Z]+)=(.*)$/
            )

        if (match) {
            const key =
                match[1]

            const [
                realValue,
                fakeValue,
            ] =
                match[2]
                    .split("||")
                    .map((v) =>
                        (v || "")
                            .trim()
                    )

            variables[key] =
                redacted
                    ? fakeValue || ""
                    : realValue || ""

            bodyStartIndex =
                i + 1

            continue
        }

        if (line !== "") {
            break
        }
    }

    let body =
        lines
            .slice(
                bodyStartIndex
            )
            .join("\n")

    for (
        const [
            key,
            value,
        ] of Object.entries(
            variables
        )
    ) {
        const pattern =
            new RegExp(
                `\\{${key}\\}`,
                "g"
            )

        body =
            body.replace(
                pattern,
                value
            )
    }

    const bodyHtml =
        marked.parse(
            body
        )

    return `
<!DOCTYPE html>

<html>

<head>

<meta charset="utf-8" />

<style>

* {
    box-sizing: border-box;
}

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

.spacer {
    flex: 1;
}

.normal {
    font-weight: 400;
    font-style: normal;
    color: #444;
    white-space: nowrap;
}

.tech-stack {
    font-weight: 400;
    font-style: italic;
    color: #444;
}

.indent {
    margin-left: 4px;
}

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

.headerInfo a {
    color: #1a1f27;
    text-decoration: none;
}

ul {
    margin: 2px 0 8px;
    padding-left: 16px;
}

li {
    margin-bottom: 2px;
}

p {
    margin: 4px 0;
}

</style>

</head>

<body>

${bodyHtml}

</body>

</html>
`
}


// ─────────────────────────────────────────────────────────────────────────
// HTML -> PDF
// ─────────────────────────────────────────────────────────────────────────

async function generatePdfFromHtml(
    htmlContent
) {
    let browser

    try {
        browser =
            await puppeteer.launch()

        const page =
            await browser.newPage()

        await page.setContent(
            htmlContent,
            {
                waitUntil:
                    "networkidle0",
            }
        )

        const pdfBuffer =
            await page.pdf({
                format:
                    "A4",

                margin: {
                    top:
                        "16mm",

                    bottom:
                        "16mm",

                    left:
                        "14mm",

                    right:
                        "14mm",
                },
            })

        return pdfBuffer
    } finally {
        if (browser) {
            await browser.close()
        }
    }
}


// ─────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────

module.exports = {
    generateInterviewReport,
    generateResumePdf,
    getEmbedding,
    generateRagAnswer,
}