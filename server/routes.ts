import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { fileUploadSchema, generateResumeSchema } from "../shared/schema.js";
import multer from "multer";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // File upload endpoint
  app.post("/api/upload", upload.fields([
    { name: 'jobDescription', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let jobDescriptionText = "";
      let resumeText = "";

      // Process job description
      if (files.jobDescription) {
        const jdFile = files.jobDescription[0];
        jobDescriptionText = await extractTextFromFile(jdFile.path, jdFile.mimetype);
      } else if (req.body.jobDescriptionText) {
        jobDescriptionText = req.body.jobDescriptionText;
      }

      // Process resume
      if (files.resume) {
        const resumeFile = files.resume[0];
        resumeText = await extractTextFromFile(resumeFile.path, resumeFile.mimetype);
      }

      if (!jobDescriptionText || !resumeText) {
        return res.status(400).json({ message: "Both job description and resume are required" });
      }

      // Parse resume into structured data
      const parsedData = await parseResume(resumeText);

      // Create resume job
      const job = await storage.createResumeJob({
        jobDescription: jobDescriptionText,
        originalResume: resumeText,
        parsedData,
        generationMode: "template",
        selectedTemplate: null,
        enhancedContent: null,
        matchScore: null,
        status: "processing"
      });

      // Clean up uploaded files
      if (files.jobDescription) await fs.unlink(files.jobDescription[0].path).catch(() => {});
      if (files.resume) await fs.unlink(files.resume[0].path).catch(() => {});

      res.json({ jobId: job.id, parsedData });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to process files" });
    }
  });

  // Generate enhanced resume
  app.post("/api/generate", async (req, res) => {
    try {
      const { jobId, mode, template } = generateResumeSchema.parse(req.body);
      
      const job = await storage.getResumeJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Calculate match score
      const matchScore = await calculateMatchScore(job.jobDescription, job.originalResume);

      // Generate enhanced content using AI
      const enhancedContent = await generateEnhancedContent(
        job.jobDescription, 
        job.originalResume, 
        job.parsedData
      );

      // Update job with results
      const updatedJob = await storage.updateResumeJob(jobId, {
        generationMode: mode,
        selectedTemplate: template,
        enhancedContent,
        matchScore,
        status: "completed"
      });

      res.json({ 
        job: updatedJob,
        matchScore,
        enhancedContent 
      });
    } catch (error) {
      console.error("Generation error:", error);
      res.status(500).json({ message: "Failed to generate resume" });
    }
  });

  // Get job status
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getResumeJob(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      console.error("Get job error:", error);
      res.status(500).json({ message: "Failed to get job" });
    }
  });

  // Download resume
  app.get("/api/download/:id/:format", async (req, res) => {
    try {
      const { id, format } = req.params;
      const job = await storage.getResumeJob(id);
      
      if (!job || job.status !== "completed") {
        return res.status(404).json({ message: "Resume not ready" });
      }

      const filePath = await formatResume(job, format);
      
      // Set appropriate headers
      const fileName = `resume_${id}.${format}`;
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
      } else if (format === 'docx') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      }
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      res.download(filePath);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Failed to download resume" });
    }
  });

  // Preview resume (HTML)
  app.get("/api/preview/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const job = await storage.getResumeJob(id);
      
      if (!job || job.status !== "completed") {
        return res.status(404).json({ message: "Resume not ready" });
      }

      const htmlContent = await formatResumeAsHTML(job);
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
    } catch (error) {
      console.error("Preview error:", error);
      res.status(500).json({ message: "Failed to generate preview" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions that call Python services
async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [
      path.join(process.cwd(), 'server/services/file-processor.py'),
      filePath,
      mimeType
    ]);

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Python process failed: ${error}`));
      }
    });
  });
}

async function parseResume(resumeText: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [
      path.join(process.cwd(), 'server/services/resume-parser.py')
    ]);

    python.stdin.write(resumeText);
    python.stdin.end();

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${output}`));
        }
      } else {
        reject(new Error(`Python process failed: ${error}`));
      }
    });
  });
}

async function calculateMatchScore(jobDescription: string, resume: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [
      path.join(process.cwd(), 'server/services/resume-generator.py'),
      'match'
    ]);

    python.stdin.write(JSON.stringify({ jobDescription, resume }));
    python.stdin.end();

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        resolve(parseInt(output.trim()));
      } else {
        reject(new Error(`Python process failed: ${error}`));
      }
    });
  });
}

async function generateEnhancedContent(jobDescription: string, originalResume: string, parsedData: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [
      path.join(process.cwd(), 'server/services/resume-generator.py'),
      'enhance'
    ]);

    python.stdin.write(JSON.stringify({ jobDescription, originalResume, parsedData }));
    python.stdin.end();

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Python process failed: ${error}`));
      }
    });
  });
}

async function formatResume(job: any, format: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [
      path.join(process.cwd(), 'server/services/resume-formatter.py'),
      format,
      job.selectedTemplate || 'modern'
    ]);

    python.stdin.write(JSON.stringify(job));
    python.stdin.end();

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Python process failed: ${error}`));
      }
    });
  });
}

async function formatResumeAsHTML(job: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [
      path.join(process.cwd(), 'server/services/resume-formatter.py'),
      'html',
      job.selectedTemplate || 'modern'
    ]);

    python.stdin.write(JSON.stringify(job));
    python.stdin.end();

    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Python process failed: ${error}`));
      }
    });
  });
}
