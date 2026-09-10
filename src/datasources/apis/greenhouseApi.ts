import axios from "axios";
import { Job } from "../cache.js";

// Popular companies that use Greenhouse (public boards)
const GREENHOUSE_COMPANIES = [
  "airbnb",
  "stripe",
  "dropbox",
  "coinbase",
  "robinhood",
  "doordash",
  "reddit",
  "cloudflare",
  "gitlab",
  "figma",
];

export const greenhouseApi = {
  async searchJobs(query: string, location: string): Promise<Job[]> {
    const allJobs: Job[] = [];

    for (const company of GREENHOUSE_COMPANIES) {
      try {
        const response = await axios.get(
          `https://boards-api.greenhouse.io/v1/boards/${company}/jobs`,
          { timeout: 5000 }
        );

        if (!response.data.jobs) continue;

        const jobs = response.data.jobs
          .filter((job: any) => {
  const titleMatch = job.title?.toLowerCase().includes(query.toLowerCase());
  
  // If searching for Remote, include jobs marked as remote OR return all (Greenhouse doesn't always tag remote)
  const jobLocation = job.location?.name?.toLowerCase() || "";
  const locationMatch =
    location.toLowerCase() === "remote" ||
    location.toLowerCase() === "" ||
    jobLocation.includes(location.toLowerCase()) ||
    jobLocation.includes("remote");
  
  return titleMatch && locationMatch;
})
          .map((job: any) => ({
            id: `greenhouse-${job.id}`,
            source: "greenhouse",
            title: job.title || "Untitled",
            company: company.charAt(0).toUpperCase() + company.slice(1),
            location: job.location?.name || "Not specified",
            description: job.content?.substring(0, 500) || "",
            url: job.absolute_url,
            salaryMin: null,
            salaryMax: null,
            postedDate: job.updated_at 
              ? new Date(job.updated_at).toISOString().split("T")[0] 
              : new Date().toISOString().split("T")[0],
          }));

        allJobs.push(...jobs);
      } catch (error) {
  // Silently skip companies with disabled/broken APIs
}
    }

    return allJobs;
  },
};