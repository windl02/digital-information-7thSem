import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { jobs } from './schema/job'
import { getCookie, deleteCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'
import { eq } from 'drizzle-orm'

export const homeHandler = (app: Hono<{ Bindings: { DB: any } }>) => {
    // Endpoint để lấy danh sách công việc và trạng thái đăng nhập
    app.get('/home', async (c) => {
        const db = drizzle(c.env.DB)
        const token = getCookie(c, 'token')

        let isLoggedIn = false
        if (token) {
            try {
                await verify(token, 'lbIUVipXAWnz3UaHfslL2trn3LBe0gjj')
                isLoggedIn = true
            } catch (e) {
                isLoggedIn = false
            }
        }

        const allJobs = await db.select()
            .from(jobs)
            .all()

        return c.json({
            isLoggedIn,
            allJobs
        })
    })

    // Endpoint để đăng xuất
    app.post('/logout', (c) => {
        deleteCookie(c, 'token')
        return c.json({ success: true, message: "Logged out successfully" })
    })

    // Endpoint để lấy chi tiết công việc dựa trên ID
    app.get('/details/:id', async (c) => {
        const db = drizzle(c.env.DB)
        const id = c.req.param('id')  // Lấy ID từ URL

        const job = await db.select()
            .from(jobs)
            .where(eq(jobs.id, parseInt(id)))
            .get()

        if (!job) {
            return c.json({ message: "Job not found" }, 404)
        }

        return c.json(job)
    })
}
