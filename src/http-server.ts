import express, { Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { searchJobs } from "./tools/searchJobs.js";
import { getJobDetails } from "./tools/getJobDetails.js";
import { initializeCache } from "./datasources/cache.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting - prevent API abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: "Too many requests",
    message: "Please try again in 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: "Too many search requests",
    message: "Please slow down, max 10 searches per minute",
  },
});

// Apply general rate limit to all /api routes
app.use("/api", apiLimiter);

// Initialize cache
initializeCache();

// Serve static frontend from /public
app.use(express.static(path.join(__dirname, "../public")));

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// API documentation endpoint
app.get("/api", (req: Request, res: Response) => {
  res.json({
    name: "Job Board MCP HTTP API",
    version: "1.0.0",
    description: "REST API wrapper for the Job Board MCP Server",
    endpoints: {
      "GET /": "Frontend UI",
      "GET /api": "This documentation",
      "GET /health": "Health check",
      "GET /api/search": "Search jobs. Query params: query (required), location, limit",
      "GET /api/jobs/:jobId": "Get details for a specific job",
    },
    examples: {
      search: "/api/search?query=Cloud Engineer&location=Remote&limit=10",
      jobDetails: "/api/jobs/lever-b172b5c0-d94c-443c-9552-ac877458fb27",
    },
    sources: ["Lever", "Greenhouse", "RemoteOK"],
  });
});

// Search jobs endpoint (with extra rate limit)
app.get("/api/search", searchLimiter, async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string;
    const location = (req.query.location as string) || "Remote";
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query) {
      return res.status(400).json({
        error: "Missing required parameter: query",
        example: "/api/search?query=Engineer&location=Remote&limit=10",
      });
    }

    const result = await searchJobs({ query, location, limit });
    
    res.json({
      success: !result.isError,
      data: result.content[0].text,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get job details endpoint
app.get("/api/jobs/:jobId", async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId as string;
    const result = await getJobDetails({ jobId });

    if (result.isError) {
      return res.status(404).json({
        success: false,
        error: result.content[0].text,
      });
    }

    res.json({
      success: true,
      data: result.content[0].text,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Start the HTTP server
app.listen(PORT, () => {
  console.log(`🚀 Job Board HTTP API running on port ${PORT}`);
  console.log(`🌐 Frontend UI: http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Search jobs: http://localhost:${PORT}/api/search?query=Engineer`);
});