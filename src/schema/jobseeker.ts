// jobSeekers.ts
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"
import { account } from './account'

export const jobSeekers = sqliteTable('jobSeekers', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }), 
  fullName: text('fullName').notNull(),
  username: text('username').notNull().references(() => account.username),
  dateOfBirth: text('dateOfBirth').notNull(), 
  address: text('address').notNull(), 
  phoneNumber: text('phoneNumber').notNull(), 
  email: text('email').notNull(), 
  experience: text('experience').notNull(), 
  skills: text('skills').notNull(),
  education: text('education').notNull(), 
  avatarUrl: text('avatarUrl').notNull(), 
})
