// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  users;
  resumeJobs;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.resumeJobs = /* @__PURE__ */ new Map();
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async createResumeJob(insertJob) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const job = {
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
  async getResumeJob(id) {
    return this.resumeJobs.get(id);
  }
  async updateResumeJob(id, updates) {
    const job = this.resumeJobs.get(id);
    if (!job) return void 0;
    const updatedJob = {
      ...job,
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.resumeJobs.set(id, updatedJob);
    return updatedJob;
  }
  async getAllResumeJobs() {
    return Array.from(this.resumeJobs.values());
  }
};
var storage = new MemStorage();

// server/routes.ts
import { generateResumeSchema } from "@shared/schema.js";
import multer from "multer";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
var upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }
  // 10MB limit
});
async function registerRoutes(app2) {
  app2.post("/api/upload", upload.fields([
    { name: "jobDescription", maxCount: 1 },
    { name: "resume", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files;
      let jobDescriptionText = "";
      let resumeText = "";
      if (files.jobDescription) {
        const jdFile = files.jobDescription[0];
        jobDescriptionText = await extractTextFromFile(jdFile.path, jdFile.mimetype);
      } else if (req.body.jobDescriptionText) {
        jobDescriptionText = req.body.jobDescriptionText;
      }
      if (files.resume) {
        const resumeFile = files.resume[0];
        resumeText = await extractTextFromFile(resumeFile.path, resumeFile.mimetype);
      }
      if (!jobDescriptionText || !resumeText) {
        return res.status(400).json({ message: "Both job description and resume are required" });
      }
      const parsedData = await parseResume(resumeText);
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
      if (files.jobDescription) await fs.unlink(files.jobDescription[0].path).catch(() => {
      });
      if (files.resume) await fs.unlink(files.resume[0].path).catch(() => {
      });
      res.json({ jobId: job.id, parsedData });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to process files" });
    }
  });
  app2.post("/api/generate", async (req, res) => {
    try {
      const { jobId, mode, template } = generateResumeSchema.parse(req.body);
      const job = await storage.getResumeJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      const matchScore = await calculateMatchScore(job.jobDescription, job.originalResume);
      const enhancedContent = await generateEnhancedContent(
        job.jobDescription,
        job.originalResume,
        job.parsedData
      );
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
  app2.get("/api/jobs/:id", async (req, res) => {
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
  app2.get("/api/download/:id/:format", async (req, res) => {
    try {
      const { id, format } = req.params;
      const job = await storage.getResumeJob(id);
      if (!job || job.status !== "completed") {
        return res.status(404).json({ message: "Resume not ready" });
      }
      const filePath = await formatResume(job, format);
      const fileName = `resume_${id}.${format}`;
      if (format === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
      } else if (format === "docx") {
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      }
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.download(filePath);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Failed to download resume" });
    }
  });
  app2.get("/api/preview/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const job = await storage.getResumeJob(id);
      if (!job || job.status !== "completed") {
        return res.status(404).json({ message: "Resume not ready" });
      }
      const htmlContent = await formatResumeAsHTML(job);
      res.setHeader("Content-Type", "text/html");
      res.send(htmlContent);
    } catch (error) {
      console.error("Preview error:", error);
      res.status(500).json({ message: "Failed to generate preview" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
async function extractTextFromFile(filePath, mimeType) {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [
      path.join(process.cwd(), "server/services/file-processor.py"),
      filePath,
      mimeType
    ]);
    let output = "";
    let error = "";
    python.stdout.on("data", (data) => {
      output += data.toString();
    });
    python.stderr.on("data", (data) => {
      error += data.toString();
    });
    python.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Python process failed: ${error}`));
      }
    });
  });
}
async function parseResume(resumeText) {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [
      path.join(process.cwd(), "server/services/resume-parser.py")
    ]);
    python.stdin.write(resumeText);
    python.stdin.end();
    let output = "";
    let error = "";
    python.stdout.on("data", (data) => {
      output += data.toString();
    });
    python.stderr.on("data", (data) => {
      error += data.toString();
    });
    python.on("close", (code) => {
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
async function calculateMatchScore(jobDescription, resume) {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [
      path.join(process.cwd(), "server/services/resume-generator.py"),
      "match"
    ]);
    python.stdin.write(JSON.stringify({ jobDescription, resume }));
    python.stdin.end();
    let output = "";
    let error = "";
    python.stdout.on("data", (data) => {
      output += data.toString();
    });
    python.stderr.on("data", (data) => {
      error += data.toString();
    });
    python.on("close", (code) => {
      if (code === 0) {
        resolve(parseInt(output.trim()));
      } else {
        reject(new Error(`Python process failed: ${error}`));
      }
    });
  });
}
async function generateEnhancedContent(jobDescription, originalResume, parsedData) {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [
      path.join(process.cwd(), "server/services/resume-generator.py"),
      "enhance"
    ]);
    python.stdin.write(JSON.stringify({ jobDescription, originalResume, parsedData }));
    python.stdin.end();
    let output = "";
    let error = "";
    python.stdout.on("data", (data) => {
      output += data.toString();
    });
    python.stderr.on("data", (data) => {
      error += data.toString();
    });
    python.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Python process failed: ${error}`));
      }
    });
  });
}
async function formatResume(job, format) {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [
      path.join(process.cwd(), "server/services/resume-formatter.py"),
      format,
      job.selectedTemplate || "modern"
    ]);
    python.stdin.write(JSON.stringify(job));
    python.stdin.end();
    let output = "";
    let error = "";
    python.stdout.on("data", (data) => {
      output += data.toString();
    });
    python.stderr.on("data", (data) => {
      error += data.toString();
    });
    python.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Python process failed: ${error}`));
      }
    });
  });
}
async function formatResumeAsHTML(job) {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [
      path.join(process.cwd(), "server/services/resume-formatter.py"),
      "html",
      job.selectedTemplate || "modern"
    ]);
    python.stdin.write(JSON.stringify(job));
    python.stdin.end();
    let output = "";
    let error = "";
    python.stdout.on("data", (data) => {
      output += data.toString();
    });
    python.stderr.on("data", (data) => {
      error += data.toString();
    });
    python.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Python process failed: ${error}`));
      }
    });
  });
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(__dirname, "client", "src"),
      "@shared": path2.resolve(__dirname, "shared"),
      "@assets": path2.resolve(__dirname, "attached_assets")
    }
  },
  root: path2.resolve(__dirname, "client"),
  build: {
    outDir: path2.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    port: 5e3,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path3.dirname(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname2, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    log(`Error: ${message} (${status})`);
    res.status(status).json({ message });
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
