import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const resumeJobs = pgTable("resume_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobDescription: text("job_description").notNull(),
  originalResume: text("original_resume").notNull(),
  parsedData: json("parsed_data").notNull(),
  generationMode: text("generation_mode").notNull(), // "template" or "preserve"
  selectedTemplate: text("selected_template"),
  enhancedContent: text("enhanced_content"),
  matchScore: integer("match_score"),
  status: text("status").notNull().default("processing"), // "processing", "completed", "failed"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertResumeJobSchema = createInsertSchema(resumeJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertResumeJob = z.infer<typeof insertResumeJobSchema>;
export type ResumeJob = typeof resumeJobs.$inferSelect;

// Additional schemas for API requests
export const fileUploadSchema = z.object({
  jobDescriptionFile: z.string().optional(),
  resumeFile: z.string().optional(),
  jobDescriptionText: z.string().optional(),
});

export const generateResumeSchema = z.object({
  jobId: z.string(),
  mode: z.enum(["template", "preserve"]),
  template: z.string().optional(),
});

export const parsedResumeSchema = z.object({
  summary: z.string(),
  workExperience: z.array(z.object({
    company: z.string(),
    position: z.string(),
    duration: z.string(),
    responsibilities: z.array(z.string()),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    year: z.string(),
  })),
  skills: z.array(z.string()),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
  })),
});

export type ParsedResume = z.infer<typeof parsedResumeSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type GenerateResume = z.infer<typeof generateResumeSchema>;
