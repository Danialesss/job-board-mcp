# Job Board MCP Server

A Model Context Protocol (MCP) server that aggregates job listings from multiple platforms into a single searchable interface. Built with TypeScript, containerized with Docker, and deployed with a full CI/CD pipeline.

![Tests](https://github.com/Danialesss/job-board-mcp/actions/workflows/test.yml/badge.svg)
![Docker Build](https://github.com/Danialesss/job-board-mcp/actions/workflows/docker-build.yml/badge.svg)
![Node](https://img.shields.io/badge/node-22.x-green)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

## Why I Built This

I wanted a way to search job listings across multiple platforms without hopping between different sites. Most job aggregators either require paid API access or scrape sites in ways that break constantly. So I built one that pulls from public ATS (Applicant Tracking System) APIs, which is both legitimate and reliable.

This also gave me an excuse to build something end-to-end: TypeScript, testing, Docker, CI/CD, the whole stack.

## Features

- **Multi-source aggregation** — Pulls from Lever, Greenhouse, and RemoteOK simultaneously
- **Smart caching** — SQLite layer reduces redundant API calls by 70%+
- **Round-robin merging** — Results are interleaved so no single source dominates
- **Parallel fetching** — All API calls happen concurrently for faster responses
- **MCP protocol** — Works with any MCP-compatible client (Claude Desktop, etc.)
- **Containerized** — Multi-stage Docker build produces a 197MB production image
- **Automated CI/CD** — Every push runs tests and builds Docker images

## Architecture
┌─────────────────────────────────────────────────────┐
│ MCP Client (Claude Desktop, etc.) │
└────────────────────┬────────────────────────────────┘
│ MCP Protocol (stdio)
↓
┌─────────────────────────────────────────────────────┐
│ MCP Server (Node.js + TypeScript) │
│ ┌──────────────┐ ┌──────────────┐ │
│ │ Tool │ │ Cache │ │
│ │ Handlers │ │ Layer │ │
│ └──────┬───────┘ └──────┬───────┘ │
└────────┼─────────────────┼──────────────────────────┘
│ │
↓ ↓
┌──────────┐ ┌──────────┐
│ External │ │ SQLite │
│ APIs │ │ Database │
│ │ │ │
│ • Lever │ │ (cache) │
│ • Green- │ │ │
│ house │ └──────────┘
│ • RemOK │
└──────────┘

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js 22 |
| Language | TypeScript 5 |
| Framework | @modelcontextprotocol/sdk |
| HTTP Client | Axios |
| Database | SQLite (better-sqlite3) |
| Testing | Jest |
| Container | Docker (multi-stage build) |
| CI/CD | GitHub Actions |

## Available Tools

### `search_jobs`
Search for job listings across all connected platforms.

**Parameters:**
- `query` (required) — Job title or keyword (e.g., "Cloud Engineer")
- `location` (optional) — Location filter (default: "Remote")
- `limit` (optional) — Max results (default: 10)

### `get_job_details`
Get detailed information for a specific job posting.

**Parameters:**
- `jobId` (required) — The unique job ID from search results

## Quick Start

### Prerequisites
- Node.js 22 or higher
- npm

### Local Development

```bash
# Clone the repo
git clone https://github.com/Danialesss/job-board-mcp.git
cd job-board-mcp

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run the server
npm start
```

### Docker

```bash
# Build the image
docker build -t job-board-mcp .

# Run the container
docker run -it job-board-mcp

# Or use docker-compose
docker compose up
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage
```

## Project Structure

job-board-mcp/
├── src/
│ ├── index.ts # MCP server entry point
│ ├── tools/ # MCP tool handlers
│ │ ├── searchJobs.ts
│ │ └── getJobDetails.ts
│ ├── datasources/
│ │ ├── cache.ts # SQLite caching layer
│ │ └── apis/ # External API integrations
│ │ ├── leverApi.ts
│ │ ├── greenhouseApi.ts
│ │ └── remoteOkApi.ts
├── tests/ # Jest test suites
├── .github/workflows/ # GitHub Actions CI/CD
├── Dockerfile # Multi-stage container build
└── docker-compose.yml



## CI/CD Pipeline

Every push to `main` triggers two automated workflows:

1. **Run Tests** — Installs dependencies, builds TypeScript, runs the full Jest suite with coverage reporting
2. **Build Docker Image** — Builds the multi-stage Docker image with layer caching to verify the container ships correctly

## Testing

The project has 12 test cases covering the cache layer, tool handlers, and error paths. Coverage sits at around 85% for business logic (excluding server bootstrapping).

## Challenges I Ran Into

- **Native modules in Docker** — `better-sqlite3` requires Python and build tools to compile. Solved with a multi-stage build that keeps the final image slim.
- **Node version mismatch** — `better-sqlite3` needed Node 22+, which conflicted with GitHub Actions' default matrix. Simplified to Node 22 only.
- **ESM + Jest** — TypeScript ESM support in Jest is famously painful. Solved with `--experimental-vm-modules` flag and a custom `tsconfig.test.json`.
- **Source dominance** — Lever was returning first and filling the result limit before Greenhouse/RemoteOK. Fixed by interleaving results round-robin.
- **CI cache directory** — SQLite failed on GitHub Actions because the `data/` directory didn't exist. Added a check to create it if missing.

## Future Improvements

- [ ] Add more ATS sources (Ashby, Workable, SmartRecruiters)
- [ ] Add job filtering by salary range
- [ ] Add pagination for large result sets
- [ ] Deploy to Render or Fly.io for public access
- [ ] Add rate limiting per source
- [ ] Implement scheduled cache refresh

## License

MIT

## Author

**Tun Danial Adli Bin Tun Ali**  
GitHub: [@Danialesss](https://github.com/Danialesss)
