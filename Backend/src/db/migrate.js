require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { pool } = require('../config/database')

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '../migrations/001_init.sql'), 'utf8')
  await pool.query(sql)
  console.log('Database migration completed')
  await pool.end()
}

migrate().catch(async (err) => {
  console.error('Migration failed:', err.message)
  await pool.end()
  process.exit(1)
})
