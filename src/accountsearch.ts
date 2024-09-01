import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { like } from 'drizzle-orm'
import { account } from './schema/account'

export const accountSearchHandler = (app: Hono<{ Bindings: { DB: any } }>) => {
    app.get('/search/account', async (c) => {
        const db = drizzle(c.env.DB)
        const { username } = c.req.query()

        const query = await db.select()
            .from(account)
            .where(like(account.username, `%${username}%`))
            .all()

        return c.json(query)
    })
}
