import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"

export const account = sqliteTable('account', {
    id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
    username: text('username').notNull(),
    password: text('password').notNull(),
    role: text('role').notNull(),
})