import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { eq, like } from 'drizzle-orm'
import { account } from './schema/account'
import { jobSeekers } from './schema/jobseeker'
import { HTTPException } from 'hono/http-exception'
import { getCookie, setCookie } from 'hono/cookie'
import { verify, sign } from 'hono/jwt'

// Schema cho đăng ký và đăng nhập
const authSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required")
})

// Handler cho đăng nhập
export const loginHandler = (app: Hono<{ Bindings: { DB: any } }>) => {
    app.post('/login', zValidator('json', authSchema), async (c) => {
        const { username, password } = await c.req.json()
        const db = drizzle(c.env.DB)
        const acc = await db.select().from(account)
            .where(eq(account.username, username))
            .get()

        if (!acc) {
            throw new HTTPException(401, { message: "Username not found" })
        }

        if (acc.password !== password) {
            throw new HTTPException(401, { message: "Invalid password" })
        }

        const payload = {
            username,
            // exp: Math.floor(Date.now() / (1000 * 60 * 60))
            exp: 1000 // Thay đổi thời gian hết hạn token nếu cần
        }

        const token = await sign(payload, 'lbIUVipXAWnz3UaHfslL2trn3LBe0gjj')

        setCookie(c, 'token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
        })

        return c.json({
            payload,
            token
        })
    })
}

// Handler cho đăng ký
export const registerHandler = (app: Hono<{ Bindings: { DB: any } }>) => {
    app.post('/register', zValidator('json', authSchema), async (c) => {
        const db = drizzle(c.env.DB)
        const { username, password } = await c.req.json()

        // Kiểm tra xem username đã tồn tại chưa
        const existingUser = await db.select()
            .from(account)
            .where(eq(account.username, username))
            .get()

        if (existingUser) {
            throw new HTTPException(409, { message: "Username already exists" })
        }

        // Nếu username chưa tồn tại, tiến hành đăng ký
        const role = "jobseeker"

        const query = await db.insert(account)
            .values({ username, password, role })
            .returning()

        return c.json(query)
    })
}

// Handler để cập nhật mật khẩu
export const updatePasswordHandler = (app: Hono<{ Bindings: { DB: any } }>) => {
    app.post('/update-password', async (c) => {
        const db = drizzle(c.env.DB)
        const { oldPassword, newPassword } = await c.req.json()
        const token = getCookie(c, 'token')

        if (!token) {
            return c.json({ message: "Unauthorized" }, 401)
        }

        let decoded
        try {
            decoded = await verify(token, 'lbIUVipXAWnz3UaHfslL2trn3LBe0gjj')
        } catch (e) {
            return c.json({ message: "Invalid token" }, 401)
        }

        const username = String(decoded.username)

        const acc = await db.select()
            .from(account)
            .where(eq(account.username, username))
            .get()

        if (!acc) {
            return c.json({ message: "User account not found" }, 404)
        }

        if (acc.password !== oldPassword) {
            return c.json({ message: "Old password is incorrect" }, 401)
        }

        await db.update(account)
            .set({ password: newPassword })
            .where(eq(account.username, username))
            .run()

        return c.json({ message: "Password updated successfully" })
    })
}


// Handler cho tìm kiếm tài khoản
export const accountSearchHandler = (app: Hono<{ Bindings: { DB: any } }>) => {
    app.get('/account/search', async (c) => {
      const db = drizzle(c.env.DB)
      const { username } = c.req.query()
  
      const query = await db.select()
        .from(account)
        .where(like(account.username, `%${username}%`))
        .all()
  
      return c.json(query)
    })
  }
  

// Handler cho xóa tài khoản
export const deleteHandler = (app: Hono<{ Bindings: { DB: any } }>) => {
    app.delete('/account/delete', async (c) => {
        const db = drizzle(c.env.DB)
        const { id } = c.req.query()

        // Kiểm tra token trong cookie
        const token = getCookie(c, 'token')
        if (!token) {
            throw new HTTPException(401, { message: "Unauthorized" })
        }

        // Xác thực token JWT
        let payload: any
        try {
            payload = await verify(token, 'lbIUVipXAWnz3UaHfslL2trn3LBe0gjj')
        } catch (e) {
            throw new HTTPException(401, { message: "Invalid token" })
        }

        // Lấy thông tin tài khoản dựa trên id
        const existingAccount = await db.select()
            .from(account)
            .where(eq(account.id, Number(id)))
            .get()

        if (!existingAccount) {
            throw new HTTPException(404, { message: "Account not found" })
        }

        // So sánh username trong token với tài khoản cần xóa
        if (existingAccount.username !== payload.username) {
            throw new HTTPException(403, { message: "Forbidden: You can only delete your own account" })
        }

        // Xóa bản ghi trong bảng jobSeekers trước
        await db.delete(jobSeekers)
            .where(eq(jobSeekers.username, existingAccount.username))
            .run()

        // Sau đó xóa bản ghi trong bảng account
        await db.delete(account)
            .where(eq(account.id, Number(id)))
            .run()

        return c.json({ message: "Account and related jobseeker data deleted successfully" })
    })
}
