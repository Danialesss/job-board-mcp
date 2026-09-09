import { getJobFromCache } from "../datasources/cache.js";

interface GetJobDetailsInput {
  jobId: string;
}

export async function getJobDetails(input: GetJobDetailsInput) {
  const { jobId } = input;

  try {
    const job = getJobFromCache(jobId);

    if (!job) {
      return {
        content: [
          {
            type: "text",
            text: `Job with ID "${jobId}" not found. Try searching for jobs first with search_jobs.`,
          },
        ],
        isError: true,
      };
    }

    const details = `
# ${job.title}

**Company:** ${job.company}
**Location:** ${job.location}
**Source:** ${job.source}
**Posted:** ${job.postedDate || "Unknown"}
**Apply URL:** ${job.url || "Not available"}

## Description
${job.description || "No description available."}

## Salary
${job.salaryMin && job.salaryMax ? `$${job.salaryMin} - $${job.salaryMax}` : "Not listed"}
    `.trim();

    return {
      content: [
        {
          type: "text",
          text: details,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error fetching job details: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}