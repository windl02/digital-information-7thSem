import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'
import { jobs } from './schema/job'
import { company } from './schema/company'
import { eq, or, like, sql } from 'drizzle-orm'

// Schema cho việc thêm mới job
const addJobSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    salary: z.string().min(1, 'Salary is required'),
    level: z.string().min(1, 'Level is required'),
    exp: z.string().min(1, 'Experience is required'),
    quantity: z.string().min(1, 'Quantity is required'),
    form: z.string().min(1, 'Form is required'),
    address: z.string().min(1, 'Address is required'),
    companyName: z.string().min(1, 'Company name is required'), // Tên công ty, dùng để tìm hoặc tạo mới
    companyAddress: z.string().min(1, 'Company address is required'),
    companyUrl: z.string().min(1, 'Company URL is required'),
    description: z.string().min(1, 'Description is required'),
})

// Schema cho việc cập nhật job
const updateJobSchema = z.object({
    title: z.string().optional(),
    salary: z.string().optional(),
    level: z.string().optional(),
    exp: z.string().optional(),
    quantity: z.string().optional(),
    form: z.string().optional(),
    address: z.string().optional(),
    companyName: z.string().optional(),
    companyAddress: z.string().optional(),
    companyUrl: z.string().optional(),
    description: z.string().optional(),
})

// export const jobListHandler = (app: Hono<{ Bindings: { DB: any; SECRET: string } }>) => {
//     app.get('/api/job', async (c) => {
//         const db = drizzle(c.env.DB)

//         // Truy vấn tất cả các công việc từ bảng jobs và thông tin công ty từ bảng company
//         const allJobs = await db.select()
//             .from(jobs)
//             .innerJoin(company, eq(company.id, jobs.companyid))
//             .all()

//         return c.json(allJobs)
//     })
// }

export const jobListHandler = (app: Hono<{ Bindings: { DB: any; SECRET: string } }>) => {
    app.get('/api/job', async (c) => {
        const db = drizzle(c.env.DB)

        const page = Number(c.req.query('page') || '1')
        const pageSize = Number(c.req.query('pageSize') || '20')

        const offset = (page - 1) * pageSize

        const totalJobsResult = await db.select({
            count: sql`count(*)`.as('count')
        }).from(jobs).all()

        const totalJobs = Number(totalJobsResult[0]?.count) || 0

        const totalPages = Math.ceil(totalJobs / pageSize)

        const paginatedJobs = await db.select()
            .from(jobs)
            .innerJoin(company, eq(company.id, jobs.companyid))
            .limit(pageSize)
            .offset(offset)
            .all()

        return c.json({
            jobs: paginatedJobs,
            currentPage: page,
            pageSize: pageSize,
            totalPages: totalPages,
            totalItems: totalJobs
        })
    })
}

export const addJobHandler = (app: Hono<{ Bindings: { DB: any; SECRET: string } }>) => {
    app.post('/api/job/add', zValidator('json', addJobSchema), async (c) => {
        const db = drizzle(c.env.DB)
        const token = getCookie(c, 'token')
        const username = getCookie(c, 'username')
        const role = getCookie(c, 'role')

        // Xác thực token
        if (!token) {
            throw new HTTPException(401, { message: 'Unauthorized' })
        }

        // Chỉ admin mới được thêm job
        if (`${role}` !== 'admin') {
            throw new HTTPException(403, { message: 'Forbidden: Only admin can add jobs' })
        }

        const {
            title, salary, level, exp, quantity, form, address,
            companyName, companyAddress, companyUrl, description
        } = c.req.valid('json')

        // Kiểm tra xem company đã tồn tại chưa
        let existingCompany = await db.select().from(company)
            .where(eq(company.name, companyName))
            .get()

        // Nếu công ty chưa tồn tại, thêm mới vào bảng company
        if (!existingCompany) {
            const [newCompany] = await db.insert(company)
                .values({
                    name: companyName,
                    address: companyAddress,
                    url: companyUrl
                })
                .returning()
            existingCompany = newCompany
        }

        // Thêm job mới vào bảng jobs
        const newJob = await db.insert(jobs)
            .values({
                title,
                salary,
                level,
                exp,
                quantity,
                form,
                address,
                companyid: existingCompany.id,
                description
            })
            .returning()

        return c.json({ message: 'Job added successfully', job: newJob, token, role })
    })
}

export const updateJobHandler = (app: Hono<{ Bindings: { DB: any; SECRET: string } }>) => {
    app.put('/api/job/update', zValidator('json', updateJobSchema), async (c) => {
        const db = drizzle(c.env.DB)
        const token = getCookie(c, 'token')
        const role = getCookie(c, 'role')

        // Xác thực token
        if (!token) {
            throw new HTTPException(401, { message: 'Unauthorized' })
        }

        // Chỉ admin mới được cập nhật job

        if (`${role}` !== 'admin') {
            throw new HTTPException(403, { message: 'Forbidden: Only admin can update jobs' })
        }

        const { id } = c.req.query()
        const {
            title, salary, level, exp, quantity, form, address,
            companyName, companyAddress, companyUrl, description
        } = c.req.valid('json')

        // Kiểm tra xem job có tồn tại không
        const existingJob = await db.select().from(jobs)
            .where(eq(jobs.id, Number(id)))
            .get()

        if (!existingJob) {
            throw new HTTPException(404, { message: 'Job not found' })
        }

        let existingCompany = null

        // Nếu có thông tin công ty mới, kiểm tra xem công ty đã tồn tại chưa
        if (companyName) {
            existingCompany = await db.select().from(company)
                .where(eq(company.name, companyName))
                .get()

            // Nếu công ty chưa tồn tại, thêm mới vào bảng company
            if (!existingCompany) {
                const [newCompany] = await db.insert(company)
                    .values({
                        name: companyName,
                        address: companyAddress || '',
                        url: companyUrl || ''
                    })
                    .returning()
                existingCompany = newCompany
            }
        }

        // Chuẩn bị dữ liệu cập nhật cho job
        const updatedJobData = {
            title: title || existingJob.title,
            salary: salary || existingJob.salary,
            level: level || existingJob.level,
            exp: exp || existingJob.exp,
            quantity: quantity || existingJob.quantity,
            form: form || existingJob.form,
            address: address || existingJob.address,
            companyid: existingCompany ? existingCompany.id : existingJob.companyid,
            description: description || existingJob.description,
        }

        // Cập nhật job
        const updatedJob = await db.update(jobs)
            .set(updatedJobData)
            .where(eq(jobs.id, Number(id)))
            .returning()

        return c.json({ message: 'Job updated successfully', job: updatedJob })
    })
}

export const detailsHandler = (app: Hono<{ Bindings: { DB: any; SECRET: string } }>) => {
    app.get('/api/job/details', async (c) => {
        const db = drizzle(c.env.DB)
        const id = c.req.query('id')

        const job = await db.select()
            .from(jobs)
            .innerJoin(company, eq(company.id, jobs.companyid))
            .where(eq(jobs.id, parseInt(`${id}`)))
            .get()

        if (!job) {
            return c.json({ message: "Job not found" }, 404)
        }

        return c.json(job)
    })
}

// export const jobSearchHandler = (app: Hono<{ Bindings: { DB: any; SECRET: string } }>) => {
//     app.get('/api/job/search', async (c) => {
//         const db = drizzle(c.env.DB)
//         const { res } = c.req.query()

//         const query = await db.select()
//             .from(jobs)
//             .innerJoin(company, eq(company.id, jobs.companyid))
//             .where(
//                 or(
//                     like(jobs.title, `%${res}%`),
//                     like(jobs.salary, `%${res}%`),
//                     like(jobs.level, `%${res}%`),
//                     like(jobs.exp, `%${res}%`),
//                     like(jobs.quantity, `%${res}%`),
//                     like(jobs.form, `%${res}%`),
//                     like(jobs.address, `%${res}%`),
//                     like(jobs.description, `%${res}%`),
//                     like(company.name, `%${res}%`),
//                     like(company.address, `%${res}%`),
//                     like(company.url, `%${res}%`)
//                 )
//             )
//             .all()

//         return c.json(query)
//     })
// }

export const jobSearchHandler = (app: Hono<{ Bindings: { DB: any; SECRET: string } }>) => {
    app.get('/api/job/search', async (c) => {
        const db = drizzle(c.env.DB)

        // Lấy res từ query string (từ khóa tìm kiếm)
        const res = c.req.query('res') || ''

        // Lấy giá trị page và pageSize từ query string, nếu không có thì mặc định là 1 và 20
        const page = Number(c.req.query('page') || '1')
        const pageSize = Number(c.req.query('pageSize') || '20')

        const offset = (page - 1) * pageSize

        // Đếm tổng số công việc phù hợp với từ khóa tìm kiếm
        const totalJobsResult = await db.select({
            count: sql`count(*)`.as('count')
        })
        .from(jobs)
        .innerJoin(company, eq(company.id, jobs.companyid))
        .where(
            or(
                like(jobs.title, `%${res}%`),
                like(jobs.salary, `%${res}%`),
                like(jobs.level, `%${res}%`),
                like(jobs.exp, `%${res}%`),
                like(jobs.quantity, `%${res}%`),
                like(jobs.form, `%${res}%`),
                like(jobs.address, `%${res}%`),
                like(jobs.description, `%${res}%`),
                like(company.name, `%${res}%`),
                like(company.address, `%${res}%`),
                like(company.url, `%${res}%`)
            )
        )
        .all()

        const totalJobs = Number(totalJobsResult[0]?.count) || 0

        // Tính tổng số trang
        const totalPages = Math.ceil(totalJobs / pageSize)

        // Truy vấn các công việc phù hợp với từ khóa và phân trang
        const paginatedJobs = await db.select()
            .from(jobs)
            .innerJoin(company, eq(company.id, jobs.companyid))
            .where(
                or(
                    like(jobs.title, `%${res}%`),
                    like(jobs.salary, `%${res}%`),
                    like(jobs.level, `%${res}%`),
                    like(jobs.exp, `%${res}%`),
                    like(jobs.quantity, `%${res}%`),
                    like(jobs.form, `%${res}%`),
                    like(jobs.address, `%${res}%`),
                    like(jobs.description, `%${res}%`),
                    like(company.name, `%${res}%`),
                    like(company.address, `%${res}%`),
                    like(company.url, `%${res}%`)
                )
            )
            .limit(pageSize)
            .offset(offset)
            .all()

        // Trả về kết quả phân trang
        return c.json({
            jobs: paginatedJobs,
            currentPage: page,
            pageSize: pageSize,
            totalPages: totalPages,
            totalItems: totalJobs
        })
    })
}


export const jobSearchByFieldHandler = (app: Hono<{ Bindings: { DB: any; SECRET: string } }>) => {
    app.post('/api/job/searchbyfield', async (c) => {
        const db = drizzle(c.env.DB)
        const { res, field } = await c.req.json<{ res: string, field: string }>()

        const fieldMapping: { [key: string]: any } = {
            'title': jobs.title,
            'salary': jobs.salary,
            'level': jobs.level,
            'exp': jobs.exp,
            'quantity': jobs.quantity,
            'form': jobs.form,
            'address': jobs.address,
            'description': jobs.description,
            'companyName': company.name,
            'companyAddress': company.address,
            'companyUrl': company.url,
        }

        const selectedField = fieldMapping[field]

        if (!selectedField) {
            return c.json({ error: 'Invalid field' }, 400)
        }

        const query = await db.select()
            .from(jobs)
            .innerJoin(company, eq(company.id, jobs.companyid))
            .where(like(selectedField, `%${res}%`))
            .all()

        return c.json(query)
    })
}
