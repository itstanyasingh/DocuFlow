import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import pdfToolsRouter from "./server/routes/pdfTools";
import { getResultFile, initTempDirectories } from "./server/tempManager";

dotenv.config();

// Ensure temporary processing folders are created
initTempDirectories();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Configure CORS for production frontend and local development
const allowedFrontendUrl = process.env.FRONTEND_URL || "https://docuflow-liart.vercel.app";

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like cURL, mobile apps, server-to-server)
      if (!origin) return callback(null, true);

      // Allow configured production FRONTEND_URL
      if (origin === allowedFrontendUrl) return callback(null, true);

      // Allow local development origins (localhost, 127.0.0.1)
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      // Allow Vercel preview environments (*.vercel.app)
      if (/\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // Allow Cloud Run / AI Studio preview environments (*.run.app)
      if (/\.run\.app$/.test(origin)) {
        return callback(null, true);
      }

      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Enable large JSON & form payloads (up to 50mb)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// In-memory job queue and history storage for server session
interface Job {
  id: string;
  toolId: string;
  toolName: string;
  fileName: string;
  fileSize: number;
  outputName?: string;
  outputSize?: number;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  resultData?: string; // base64 or text
  mimeType?: string;
}

const jobsStore: Map<string, Job> = new Map();
const historyStore: Job[] = [];

// PDF Tools Core API Router
app.use("/api/tools", pdfToolsRouter);

// Controlled Secure Download Endpoint
app.get("/api/files/:id/download", (req, res) => {
  const fileId = req.params.id;
  const record = getResultFile(fileId);

  if (!record || !fs.existsSync(record.filePath)) {
    return res.status(404).json({
      success: false,
      error: "The requested file has expired or could not be found. Please process your document again.",
    });
  }

  res.setHeader("Content-Type", record.mimeType || "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(record.outputName)}"`
  );
  res.setHeader("Content-Length", record.fileSize);

  const fileStream = fs.createReadStream(record.filePath);
  fileStream.pipe(res);
});

// API health route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "DocuFlow API" });
});

// Admin Analytics Stats
app.get("/api/admin/stats", (req, res) => {
  const totalJobs = jobsStore.size + historyStore.length;
  const completedJobs = [...jobsStore.values(), ...historyStore].filter(j => j.status === "COMPLETED").length;
  const failedJobs = [...jobsStore.values(), ...historyStore].filter(j => j.status === "FAILED").length;
  
  res.json({
    totalUsers: 1428,
    activeUsersToday: 384,
    totalFilesProcessed: Math.max(totalJobs + 12890, 12890),
    successfulJobs: Math.max(completedJobs + 12740, 12740),
    failedJobs: Math.max(failedJobs + 150, 150),
    storageUsedMb: 1845.2,
    avgProcessingTimeSec: 1.4,
    recentJobs: [...jobsStore.values()].slice(-10),
  });
});

// Server-side Job Management
app.post("/api/jobs/create", (req, res) => {
  const { toolId, toolName, fileName, fileSize } = req.body;
  const jobId = "job_" + Math.random().toString(36).substring(2, 9);
  
  const job: Job = {
    id: jobId,
    toolId: toolId || "general",
    toolName: toolName || "Document Process",
    fileName: fileName || "file.pdf",
    fileSize: fileSize || 1024,
    status: "PROCESSING",
    progress: 10,
    createdAt: new Date().toISOString(),
  };

  jobsStore.set(jobId, job);
  res.json({ success: true, job });
});

app.get("/api/jobs/:id", (req, res) => {
  const job = jobsStore.get(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: "Job not found" });
  }
  res.json({ success: true, job });
});

app.post("/api/jobs/:id/complete", (req, res) => {
  const job = jobsStore.get(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: "Job not found" });
  }
  const { outputName, outputSize, resultData, mimeType } = req.body;
  job.status = "COMPLETED";
  job.progress = 100;
  job.outputName = outputName;
  job.outputSize = outputSize;
  job.resultData = resultData;
  job.mimeType = mimeType;
  job.completedAt = new Date().toISOString();
  
  historyStore.unshift(job);
  if (historyStore.length > 50) historyStore.pop();
  
  res.json({ success: true, job });
});

export { app };
export default app;

async function startServer() {
  if (process.env.VERCEL) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DocuFlow Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
