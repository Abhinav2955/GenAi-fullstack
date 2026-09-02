const db = require('../config/database')

async function getReportById(id, userId) {
  const { rows } = await db.query(`
    SELECT ir.id, ir.created_at, j.title, j.description AS job_description,
      a.self_description, r.raw_text AS resume,
      ar.match_score, ar.skill_score, ar.semantic_score, ar.keyword_score, ar.profile_score,
      ar.matched_skills, ar.missing_skills, ar.score_breakdown,
      ir.technical_questions, ir.behavioral_questions, ir.preparation_plan,
      a.id AS application_id
    FROM interview_reports ir
    JOIN applications a ON a.id=ir.application_id
    JOIN jobs j ON j.id=a.job_id
    LEFT JOIN resumes r ON r.id=a.resume_id
    JOIN analysis_results ar ON ar.application_id=a.id
    WHERE ir.id=$1 AND a.user_id=$2`, [id,userId])
  return rows[0]
}

function mapReport(row) {
  if (!row) return null
  return {
    id: row.id, _id: row.id, applicationId: row.application_id, title: row.title,
    jobDescription: row.job_description, selfDescription: row.self_description, resume: row.resume,
    matchScore: row.match_score, technicalQuestions: row.technical_questions || [], behavioralQuestions: row.behavioral_questions || [],
    skillGaps: (row.missing_skills || []).map((skill, i) => ({ skill, severity: i < 3 ? 'high' : i < 6 ? 'medium' : 'low' })),
    matchedSkills: row.matched_skills || [], missingSkills: row.missing_skills || [], preparationPlan: row.preparation_plan || [],
    scoreBreakdown: { skillScore: row.skill_score, semanticScore: row.semantic_score, keywordScore: row.keyword_score, profileScore: row.profile_score, weights: row.score_breakdown },
    createdAt: row.created_at,
  }
}

module.exports = { getReportById, mapReport }
