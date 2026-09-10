import express, { Request, Response } from "express";
import cors from "cors";
import { searchJobs } from "./tools/searchJobs.js";
import { getJobDetails } from "./tools/getJobDetails.js";
import { initializeCache } from "./datasources/cache.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize cache
initializeCache();

// Health check endpoint (Render uses this to verify service is alive)
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Root endpoint with API documentation
app.get("/", (req: Request, res: Response) => {
  res.json({
    name: "Job Board MCP HTTP API",
    version: "1.0.0",
    description: "REST API wrapper for the Job Board MCP Server",
    endpoints: {
      "GET /": "This documentation",
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

// Search jobs endpoint
app.get("/api/search", async (req: Request, res: Response) => {
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
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Search jobs: http://localhost:${PORT}/api/search?query=Engineer`);
});