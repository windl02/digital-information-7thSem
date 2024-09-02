import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { logger } from 'hono/logger'

import { account } from './schema/account'
import { homeHandler } from './homeHandler'
import { getProfileHandler, createProfileHandler, updateProfileHandler } from './profileHandler'
import { loginHandler, registerHandler, updatePasswordHandler, accountSearchHandler, deleteHandler } from './accountHandler'
import { addJobHandler, updateJobHandler, jobSearchHandler } from './jobHandler'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(logger())

// Thêm middleware CORS
const allowedOrigin = 'http://127.0.0.1:5500' // Chỉ định nguồn gốc của frontend
app.use(async (c, next) => {
  c.header('Access-Control-Allow-Origin', allowedOrigin)
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  c.header('Access-Control-Allow-Credentials', 'true')

  if (c.req.method === 'OPTIONS') {
    return c.text('', 204)
  }

  await next()
})

homeHandler(app)
loginHandler(app)
registerHandler(app)
updatePasswordHandler(app)
accountSearchHandler(app)
deleteHandler(app)
addJobHandler(app)
updateJobHandler(app)
jobSearchHandler(app)
getProfileHandler(app)
createProfileHandler(app)
updateProfileHandler(app)

app.get('/', async (c) => {
  const db = drizzle(c.env.DB)
  const querry = await db.select()
    .from(account)
    .all()

  return c.json(querry)
})

export default app