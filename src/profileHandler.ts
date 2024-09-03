import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { getCookie } from 'hono/cookie'
import { jobSeekers } from './schema/jobseeker'
import { eq } from 'drizzle-orm'

export const getProfileHandler = (app: Hono<{ Bindings: { DB: any; SECRET: string } }>) => {
    app.get('/api/profile', async (c) => {
        const db = drizzle(c.env.DB)
        const token = getCookie(c, 'token')

        if (!token) {
            return c.json({ message: "Unauthorized" }, 401)
        }

        const username = c.req.query('username')

        const profile = await db.select()
            .from(jobSeekers)
            .where(eq(jobSeekers.username, `${username}`))
            .get()

        if (!profile) {
            return c.json({ message: "No profile found" }, 404)
        }

        return c.json(profile)
    })
}

// Handler để tạo thông tin cá nhân
export const createProfileHandler = (app: Hono<{ Bindings: { DB: any; SECRET: string } }>) => {
    app.post('/api/profile/create', async (c) => {
        const db = drizzle(c.env.DB)
        const profileData = await c.req.json()
        const token = getCookie(c, 'token')

        if (!token) {
            return c.json({ message: "Unauthorized" }, 401)
        }

        const username = c.req.query('username')

        const existingProfile = await db.select()
            .from(jobSeekers)
            .where(eq(jobSeekers.username, `${username}`))
            .get()

        if (existingProfile) {
            return c.json({ message: "Profile already exists" }, 400)
        }

        profileData.username = username

        await db.insert(jobSeekers)
            .values(profileData)
            .run()

        return c.json({ message: "Profile created successfully" })
    })
}

// Handler để cập nhật thông tin cá nhân
export const updateProfileHandler = (app: Hono<{ Bindings: { DB: any; SECRET: string } }>) => {
    app.get('/api/profile/update', async (c) => {
        const db = drizzle(c.env.DB)
        const token = getCookie(c, 'token')

        if (!token) {
            return c.json({ message: "Unauthorized" }, 401)
        }

        const username = c.req.query('username')

        const profile = await db.select()
            .from(jobSeekers)
            .where(eq(jobSeekers.username, `${username}`))
            .get()

        if (!profile) {
            return c.json({ message: "No profile found" }, 404)
        }

        return c.json(profile)
    })

    app.put('/api/profile/update', async (c) => {
        const db = drizzle(c.env.DB);
        const profileData = await c.req.json();
        const token = getCookie(c, 'token');

        if (!token) {
            return c.json({ message: "Unauthorized" }, 401);
        }

        const username = c.req.query('username');

        const existingProfile = await db.select()
            .from(jobSeekers)
            .where(eq(jobSeekers.username, `${username}`))
            .get();

        if (!existingProfile) {
            return c.json({ message: "Profile not found" }, 404);
        }

        await db.update(jobSeekers)
            .set(profileData)
            .where(eq(jobSeekers.username, `${username}`))
            .run();

        return c.json({ message: "Profile updated successfully" });
    });
}
