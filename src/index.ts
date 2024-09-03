import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { logger } from 'hono/logger'
import { jwt } from 'hono/jwt'

import { homeHandler } from './homeHandler'
import { getProfileHandler, createProfileHandler, updateProfileHandler } from './profileHandler'
import { loginHandler, registerHandler, logoutHandler,updatePasswordHandler,accountSearchHandler, deleteHandler } from './accountHandler'
import { jobListHandler, detailsHandler,addJobHandler, updateJobHandler, jobSearchHandler, jobSearchByFieldHandler } from './jobHandler'
import { getCookie } from 'hono/cookie'

type Bindings = {
  DB: D1Database
  SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()
const secret = "lbIUVipXAWnz3UaHfslL2trn3LBe0gjj"
app.use(logger())

// Thêm middleware CORS
const allowedOrigin = 'https://deadinside.pages.dev' // Chỉ định nguồn gốc của frontend
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
logoutHandler(app)
registerHandler(app)
updatePasswordHandler(app)
accountSearchHandler(app)
deleteHandler(app)
jobListHandler(app)
detailsHandler(app)
addJobHandler(app)
updateJobHandler(app)
jobSearchHandler(app)
jobSearchByFieldHandler(app)
getProfileHandler(app)
createProfileHandler(app)
updateProfileHandler(app)

app.get('/', (c) => c.text('Hehe!'))

export default app