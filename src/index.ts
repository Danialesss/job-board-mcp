import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { searchJobs } from "./tools/searchJobs.js";
import { getJobDetails } from "./tools/getJobDetails.js";
import { initializeCache } from "./datasources/cache.js";

// Create the MCP server
const server = new Server(
  {
    name: "job-board-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize the SQLite cache
initializeCache();

// Register available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_jobs",
        description:
          "Search for job listings across multiple platforms (Lever, etc.). Returns a list of jobs matching the query and location.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Job title or keyword (e.g., 'Cloud Engineer', 'DevOps', 'Software Engineer')",
            },
            location: {
              type: "string",
              description: "Location filter (e.g., 'Singapore', 'Malaysia', 'Remote'). Defaults to 'Remote'.",
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 10)",
              default: 10,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_job_details",
        description:
          "Get detailed information about a specific job posting using its ID (returned from search_jobs).",
        inputSchema: {
          type: "object",
          properties: {
            jobId: {
              type: "string",
              description: "The unique job ID from search results (e.g., 'lever-abc123')",
            },
          },
          required: ["jobId"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "search_jobs") {
    return await searchJobs(args as any);
  } else if (name === "get_job_details") {
    return await getJobDetails(args as any);
  }

  return {
    content: [{ type: "text", text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Job Board MCP Server started successfully");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});