import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"

export const company = sqliteTable('company', {
    id: integer('id', {mode:'number'}).primaryKey({autoIncrement:true}),
    name: text('name').notNull(),
    address: text('address').notNull(),
    url: text('url').notNull(),
  })