const { z } = require('zod')
const db = require('../config/database')
const { extractResumeText } = require('../services/pdfExtraction.service')

const {
  generateInterviewReport,
  generateResumePdf,
  getEmbedding,
  generateRagAnswer,
} = require('../services/ai.service')

const { calculateMatch } = require('../services/skillMatching.service')
const {
  indexApplicationDocuments,
  retrieveContext,
} = require('../services/rag.service')

const {
  getReportById,
  mapReport,
} = require('../services/report.repository')

const AppError = require('../utils/AppError')

const reportSchema = z.object({
  jobDescription: z
    .string()
    .trim()
    .min(80, 'Job description is too short')
    .max(12000),

  selfDescription: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .default(''),
})

const assistantSchema = z.object({
  question: z
    .string()
    .trim()
    .min(3)
    .max(1000),
})

async function upsertSkills(
  client,
  table,
  ownerColumn,
  ownerId,
  skills
) {
  for (const name of skills) {
    const inserted = await client.query(
      `
      INSERT INTO skills(name)
      VALUES($1)
      ON CONFLICT(name)
      DO UPDATE SET name = EXCLUDED.name
      RETURNING id
      `,
      [name]
    )

    await client.query(
      `
      INSERT INTO ${table}(${ownerColumn}, skill_id)
      VALUES($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [ownerId, inserted.rows[0].id]
    )
  }
}

async function generateInterViewReportController(req, res) {
  const {
    selfDescription,
    jobDescription,
  } = req.body

  if (!req.file && !selfDescription) {
    throw new AppError(
      'Upload a PDF resume or provide a self-description.',
      400
    )
  }

  let extraction = {
    text: '',
    method: 'self-description',
  }

  if (req.file) {
    extraction = await extractResumeText(req.file.buffer)
  }

  const candidateText = [
    extraction.text,
    selfDescription,
  ]
    .filter(Boolean)
    .join('\n\n')

  let resumeEmbedding = []
  let jobEmbedding = []

  try {
    ;[resumeEmbedding, jobEmbedding] = await Promise.all([
      getEmbedding(
        candidateText,
        'SEMANTIC_SIMILARITY'
      ),

      getEmbedding(
        jobDescription,
        'SEMANTIC_SIMILARITY'
      ),
    ])
  } catch (error) {
    console.warn(
      'Embedding-based score unavailable; using lexical fallback:',
      error.message
    )
  }

  const analysis = calculateMatch({
    resumeText: candidateText,
    jobText: jobDescription,
    resumeEmbedding,
    jobEmbedding,
  })

  const aiReport = await generateInterviewReport({
    resume:
      extraction.text ||
      selfDescription,

    selfDescription,

    jobDescription,

    matchedSkills:
      analysis.matchedSkills,

    missingSkills:
      analysis.missingSkills,
  })

  const saved = await db.withTransaction(
    async (client) => {
      let resumeId = null

      if (req.file) {
        const resumeResult =
          await client.query(
            `
            INSERT INTO resumes(
              user_id,
              original_filename,
              raw_text,
              extraction_method
            )
            VALUES($1, $2, $3, $4)
            RETURNING id
            `,
            [
              req.user.id,
              req.file.originalname,
              extraction.text,
              extraction.method,
            ]
          )

        resumeId =
          resumeResult.rows[0].id

        await upsertSkills(
          client,
          'resume_skills',
          'resume_id',
          resumeId,
          analysis.resumeSkills
        )
      }

      const jobResult =
        await client.query(
          `
          INSERT INTO jobs(
            user_id,
            title,
            description
          )
          VALUES($1, $2, $3)
          RETURNING id
          `,
          [
            req.user.id,
            aiReport.title ||
              'Target role',
            jobDescription,
          ]
        )

      const jobId =
        jobResult.rows[0].id

      await upsertSkills(
        client,
        'job_skills',
        'job_id',
        jobId,
        analysis.jobSkills
      )

      const applicationResult =
        await client.query(
          `
          INSERT INTO applications(
            user_id,
            resume_id,
            job_id,
            self_description
          )
          VALUES($1, $2, $3, $4)
          RETURNING id
          `,
          [
            req.user.id,
            resumeId,
            jobId,
            selfDescription,
          ]
        )

      const applicationId =
        applicationResult.rows[0].id

      await client.query(
        `
        INSERT INTO analysis_results(
          application_id,
          match_score,
          skill_score,
          semantic_score,
          keyword_score,
          profile_score,
          matched_skills,
          missing_skills,
          score_breakdown
        )
        VALUES(
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7::jsonb,
          $8::jsonb,
          $9::jsonb
        )
        `,
        [
          applicationId,

          analysis.matchScore,

          analysis.skillScore,

          analysis.semanticScore,

          analysis.keywordScore,

          analysis.profileScore,

          JSON.stringify(
            analysis.matchedSkills
          ),

          JSON.stringify(
            analysis.missingSkills
          ),

          JSON.stringify(
            analysis.breakdown
          ),
        ]
      )

      const reportResult =
        await client.query(
          `
          INSERT INTO interview_reports(
            application_id,
            technical_questions,
            behavioral_questions,
            preparation_plan
          )
          VALUES(
            $1,
            $2::jsonb,
            $3::jsonb,
            $4::jsonb
          )
          RETURNING id
          `,
          [
            applicationId,

            JSON.stringify(
              aiReport.technicalQuestions
            ),

            JSON.stringify(
              aiReport.behavioralQuestions
            ),

            JSON.stringify(
              aiReport.preparationPlan
            ),
          ]
        )

      return {
        reportId:
          reportResult.rows[0].id,

        applicationId,
      }
    }
  )

  /*
   * Build the RAG index after the main report
   * is safely stored.
   *
   * If Gemini embeddings temporarily fail,
   * we do NOT want to lose the generated
   * interview report.
   */
  try {
    await indexApplicationDocuments({
      applicationId:
        saved.applicationId,

      resume:
        candidateText,

      jobDescription,

      selfDescription,
    })
  } catch (error) {
    console.warn(
      'RAG indexing failed; report remains usable:',
      error.message
    )
  }

  const row =
    await getReportById(
      saved.reportId,
      req.user.id
    )

  res.status(201).json({
    success: true,

    message:
      'Interview report generated successfully.',

    interviewReport:
      mapReport(row),
  })
}

async function getInterviewReportByIdController(
  req,
  res
) {
  const row =
    await getReportById(
      req.params.interviewId,
      req.user.id
    )

  if (!row) {
    throw new AppError(
      'Interview report not found.',
      404
    )
  }

  res.json({
    success: true,
    interviewReport:
      mapReport(row),
  })
}

async function getAllInterviewReportsController(
  req,
  res
) {
  const { rows } =
    await db.query(
      `
      SELECT
        ir.id,
        j.title,
        ar.match_score,
        ar.missing_skills,
        ir.created_at

      FROM interview_reports ir

      JOIN applications a
        ON a.id = ir.application_id

      JOIN jobs j
        ON j.id = a.job_id

      JOIN analysis_results ar
        ON ar.application_id = a.id

      WHERE a.user_id = $1

      ORDER BY ir.created_at DESC

      LIMIT 50
      `,
      [req.user.id]
    )

  res.json({
    success: true,

    interviewReports:
      rows.map((r) => ({
        id: r.id,

        _id: r.id,

        title: r.title,

        matchScore:
          r.match_score,

        skillGaps:
          (r.missing_skills || [])
            .slice(0, 5)
            .map((skill) => ({
              skill,
              severity:
                'medium',
            })),

        createdAt:
          r.created_at,
      })),
  })
}

async function generateResumePdfController(
  req,
  res
) {
  const row =
    await getReportById(
      req.params.interviewReportId,
      req.user.id
    )

  if (!row) {
    throw new AppError(
      'Interview report not found.',
      404
    )
  }

  const pdfBuffer =
    await generateResumePdf({
      resume:
        row.resume ||
        row.self_description,

      jobDescription:
        row.job_description,

      selfDescription:
        row.self_description,
    })

  res.set({
    'Content-Type':
      'application/pdf',

    'Content-Disposition':
      `attachment; filename=resume_${row.id}.pdf`,
  })

  res.send(pdfBuffer)
}

/*
 * RAG Assistant Controller
 *
 * Flow:
 *
 * 1. Verify report ownership
 * 2. Retrieve relevant pgvector chunks
 * 3. Build grounded context
 * 4. Ask Gemini
 * 5. Handle temporary Gemini failures cleanly
 */
async function askAssistantController(
  req,
  res
) {
  const row =
    await getReportById(
      req.params.interviewId,
      req.user.id
    )

  if (!row) {
    throw new AppError(
      'Interview report not found.',
      404
    )
  }

  /*
   * Retrieve the most relevant chunks
   * using vector similarity.
   */
  const chunks =
    await retrieveContext(
      row.application_id,
      req.body.question
    )

  if (!chunks.length) {
    throw new AppError(
      'The RAG index is not available for this report. Regenerate the report after enabling pgvector/embeddings.',
      503
    )
  }

  /*
   * Convert retrieved chunks into
   * grounded context for Gemini.
   */
  const context =
    chunks
      .map(
        (chunk, index) =>
          `[${index + 1}] ${chunk.source_type}: ${chunk.content}`
      )
      .join('\n\n')

  let answer

  try {
    answer =
      await generateRagAnswer({
        question:
          req.body.question,

        context,

        jobTitle:
          row.title,
      })
  } catch (error) {
    /*
     * Gemini can temporarily return:
     *
     * 503 UNAVAILABLE
     * 429 RESOURCE_EXHAUSTED
     *
     * These are external service problems,
     * not bugs in our own API.
     */
    const isTemporaryAiError =
      error?.status === 503 ||
      error?.status === 429 ||
      error?.message
        ?.toLowerCase()
        .includes(
          'high demand'
        ) ||
      error?.message
        ?.toLowerCase()
        .includes(
          'unavailable'
        ) ||
      error?.message
        ?.toLowerCase()
        .includes(
          'resource_exhausted'
        )

    if (isTemporaryAiError) {
      return res
        .status(503)
        .json({
          success: false,

          message:
            'AI service is temporarily busy. Please try again in a few seconds.',
        })
    }

    /*
     * Unknown errors should continue
     * to the centralized error handler.
     */
    throw error
  }

  res.json({
    success: true,

    answer,

    sources:
      chunks.map(
        (chunk, index) => ({
          index:
            index + 1,

          sourceType:
            chunk.source_type,

          similarity:
            Number(
              chunk.similarity
            ),
        })
      ),
  })
}

module.exports = {
  reportSchema,

  assistantSchema,

  generateInterViewReportController,

  getInterviewReportByIdController,

  getAllInterviewReportsController,

  generateResumePdfController,

  askAssistantController,
}