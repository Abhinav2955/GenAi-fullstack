require('dotenv').config()
const env = require('./src/config/env')
const app = require('./src/app')
const { pool, checkDatabase } = require('./src/config/database')

let server
async function start() {
  await checkDatabase()
  server = app.listen(env.PORT, () => console.log(`API running on port ${env.PORT}`))
}
async function shutdown(signal) {
  console.log(`${signal} received; shutting down gracefully`)
  if (server) server.close(async () => { await pool.end(); process.exit(0) })
  else { await pool.end(); process.exit(0) }
}
process.on('SIGTERM',()=>shutdown('SIGTERM'))
process.on('SIGINT',()=>shutdown('SIGINT'))
start().catch(async err => { console.error('Startup failed:',err); await pool.end(); process.exit(1) })
