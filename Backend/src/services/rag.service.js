const db = require('../config/database')
const { getEmbedding } = require('./ai.service')

function chunkText(text, maxChars = 1200, overlap = 180) {
  const clean = (text || '').replace(/\r/g, '').trim()
  if (!clean) return []
  const paragraphs = clean.split(/\n{2,}/).map(x => x.trim()).filter(Boolean)
  const chunks=[]
  let current=''
  for (const p of paragraphs) {
    if ((current + '\n\n' + p).length <= maxChars) current = current ? `${current}\n\n${p}` : p
    else {
      if (current) chunks.push(current)
      current = current ? `${current.slice(-overlap)}\n\n${p}` : p
      while (current.length > maxChars) {
        chunks.push(current.slice(0,maxChars))
        current = current.slice(maxChars-overlap)
      }
    }
  }
  if (current) chunks.push(current)
  return chunks
}

function vectorLiteral(values) { return `[${values.map(Number).join(',')}]` }

async function indexApplicationDocuments({ applicationId, resume, jobDescription, selfDescription }) {
  const sources = [
    ['resume', resume], ['job_description', jobDescription], ['self_description', selfDescription || '']
  ]
  for (const [sourceType, text] of sources) {
    const chunks = chunkText(text)
    for (let i=0;i<chunks.length;i++) {
      const embedding = await getEmbedding(chunks[i], 'RETRIEVAL_DOCUMENT')
      await db.query(
        `INSERT INTO document_chunks(application_id,source_type,chunk_index,content,embedding)
         VALUES($1,$2,$3,$4,$5::vector)
         ON CONFLICT(application_id,source_type,chunk_index)
         DO UPDATE SET content=EXCLUDED.content,embedding=EXCLUDED.embedding`,
        [applicationId, sourceType, i, chunks[i], vectorLiteral(embedding)]
      )
    }
  }
}

async function retrieveContext(applicationId, question, limit=6) {
  const embedding = await getEmbedding(question, 'RETRIEVAL_QUERY')
  const { rows } = await db.query(
    `SELECT source_type, content, 1 - (embedding <=> $2::vector) AS similarity
     FROM document_chunks
     WHERE application_id=$1 AND embedding IS NOT NULL
     ORDER BY embedding <=> $2::vector
     LIMIT $3`,
    [applicationId, vectorLiteral(embedding), limit]
  )
  return rows
}

module.exports = { chunkText, indexApplicationDocuments, retrieveContext }
