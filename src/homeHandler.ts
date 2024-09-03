import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { jobs } from './schema/job'
import { getCookie, deleteCookie, setCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { eq } from 'drizzle-orm'

export const homeHandler = (app: Hono<{ Bindings: { DB: any; SECRET: string } }>) => {
    app.get('/home', async (c) => {
        const db = drizzle(c.env.DB)
        const secret = c.env.SECRET
        const token = getCookie(c, 'token')
        let isLoggedIn = false

        if (token) {
            try {
                await verify(token, secret) // Xác thực token
                isLoggedIn = true
            } catch (e) {
                deleteCookie(c, 'token')
                isLoggedIn = false
            }
        }

        const allJobs = await db.select()
            .from(jobs)
            .all()

        return c.json({
            token,
            allJobs
        })
    })
}