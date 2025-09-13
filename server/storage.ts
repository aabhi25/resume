import { type User, type InsertUser, type ResumeJob, type InsertResumeJob } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Resume job operations
  createResumeJob(job: InsertResumeJob): Promise<ResumeJob>;
  getResumeJob(id: string): Promise<ResumeJob | undefined>;
  updateResumeJob(id: string, updates: Partial<ResumeJob>): Promise<ResumeJob | undefined>;
  getAllResumeJobs(): Promise<ResumeJob[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private resumeJobs: Map<string, ResumeJob>;

  constructor() {
    this.users = new Map();
    this.resumeJobs = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createResumeJob(insertJob: InsertResumeJob): Promise<ResumeJob> {
    const id = randomUUID();
    const now = new Date();
    const job: ResumeJob = { 
      ...insertJob, 
      id,
      status: insertJob.status || "processing",
      selectedTemplate: insertJob.selectedTemplate || null,
      enhancedContent: insertJob.enhancedContent || null,
      matchScore: insertJob.matchScore || null,
      createdAt: now,
      updatedAt: now
    };
    this.resumeJobs.set(id, job);
    return job;
  }

  async getResumeJob(id: string): Promise<ResumeJob | undefined> {
    return this.resumeJobs.get(id);
  }

  async updateResumeJob(id: string, updates: Partial<ResumeJob>): Promise<ResumeJob | undefined> {
    const job = this.resumeJobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { 
      ...job, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.resumeJobs.set(id, updatedJob);
    return updatedJob;
  }

  async getAllResumeJobs(): Promise<ResumeJob[]> {
    return Array.from(this.resumeJobs.values());
  }
}

export const storage = new MemStorage();
