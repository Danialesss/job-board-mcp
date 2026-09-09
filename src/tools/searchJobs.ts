import { searchCache, cacheJob, Job } from "../datasources/cache.js";
import { leverApi } from "../datasources/apis/leverApi.js";

interface SearchJobsInput {
  query: string;
  location?: string;
  limit?: number;
}

export async function searchJobs(input: SearchJobsInput) {
  const { query, location = "Remote", limit = 10 } = input;

  try {
    // Check cache first
    const cached = searchCache(query, location, limit);
    if (cached.length > 0) {
      return {
        content: [
          {
            type: "text",
            text: `Found ${cached.length} cached job listings for "${query}" in ${location}:\n\n${formatJobs(cached)}`,
          },
        ],
      };
    }

    // Fetch fresh from APIs
    const leverJobs = await leverApi.searchJobs(query, location);
    const allJobs = leverJobs.slice(0, limit);

    // Cache the results
    allJobs.forEach(cacheJob);

    if (allJobs.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No jobs found for "${query}" in ${location}. Try a different query or location.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${allJobs.length} job listings for "${query}" in ${location}:\n\n${formatJobs(allJobs)}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error searching jobs: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}

function formatJobs(jobs: Job[]): string {
  return jobs
    .map(
      (job) =>
        `• **${job.title}** at ${job.company}\n  📍 ${job.location}\n  🔗 ${job.url || "No URL"}\n  🆔 ${job.id}`
    )
    .join("\n\n");
}