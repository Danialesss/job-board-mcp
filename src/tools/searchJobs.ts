import { searchCache, cacheJob, Job } from "../datasources/cache.js";
import { leverApi } from "../datasources/apis/leverApi.js";
import { greenhouseApi } from "../datasources/apis/greenhouseApi.js";
import { remoteOkApi } from "../datasources/apis/remoteOkApi.js";

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

    // Fetch from all APIs in parallel (faster than sequential)
    const [leverJobs, greenhouseJobs, remoteOkJobs] = await Promise.all([
      leverApi.searchJobs(query, location),
      greenhouseApi.searchJobs(query, location),
      remoteOkApi.searchJobs(query, location),
    ]);

    // Interleave results from each source (round-robin) so no source dominates
const allJobs: Job[] = [];
const maxLen = Math.max(leverJobs.length, greenhouseJobs.length, remoteOkJobs.length);
for (let i = 0; i < maxLen && allJobs.length < limit; i++) {
  if (leverJobs[i]) allJobs.push(leverJobs[i]);
  if (greenhouseJobs[i] && allJobs.length < limit) allJobs.push(greenhouseJobs[i]);
  if (remoteOkJobs[i] && allJobs.length < limit) allJobs.push(remoteOkJobs[i]);
}

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

    // Count by source for summary
    const sourceCounts = allJobs.reduce((acc: Record<string, number>, job) => {
      acc[job.source] = (acc[job.source] || 0) + 1;
      return acc;
    }, {});

    const sourceSummary = Object.entries(sourceCounts)
      .map(([source, count]) => `${count} from ${source}`)
      .join(", ");

    return {
      content: [
        {
          type: "text",
          text: `Found ${allJobs.length} job listings for "${query}" in ${location} (${sourceSummary}):\n\n${formatJobs(allJobs)}`,
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
        `• **${job.title}** at ${job.company}\n  📍 ${job.location}\n  💼 Source: ${job.source}\n  🔗 ${job.url || "No URL"}\n  🆔 ${job.id}`
    )
    .join("\n\n");
}