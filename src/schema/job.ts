import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"

export const jobs = sqliteTable('jobs', {
    id: integer('id', {mode: 'number'}).primaryKey({autoIncrement:true}),
    title: text('title').notNull(),
    salary: text('salary').notNull(),
    level: text('level').notNull(),
    exp: text('exp').notNull(),
    quantity: text('quantity').notNull(),
    form: text('form').notNull(),
    address: text('address').notNull(),
    companyid: integer('companyid').notNull(),
    description: text('description').notNull(),
  })