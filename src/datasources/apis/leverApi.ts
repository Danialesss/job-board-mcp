import axios from "axios";
import { Job } from "../cache.js";

// Lever posts jobs at api.lever.co/v0/postings/{company}
// We'll query multiple companies that use Lever
const LEVER_COMPANIES = [
  "unlimit",
  "spotify",
  "kraken",
];

export const leverApi = {
  async searchJobs(query: string, location: string): Promise<Job[]> {
    const allJobs: Job[] = [];

    for (const company of LEVER_COMPANIES) {
      try {
        const response = await axios.get(
          `https://api.lever.co/v0/postings/${company}?mode=json`,
          { timeout: 5000 }
        );

        const jobs = response.data
          .filter((job: any) => {
            const titleMatch = job.text?.toLowerCase().includes(query.toLowerCase()) ||
                              job.categories?.team?.toLowerCase().includes(query.toLowerCase());
            const locationMatch = 
              location.toLowerCase() === "remote" ||
              job.categories?.location?.toLowerCase().includes(location.toLowerCase()) ||
              job.categories?.commitment?.toLowerCase().includes("remote");
            return titleMatch && locationMatch;
          })
          .map((job: any) => ({
            id: `lever-${job.id}`,
            source: "lever",
            title: job.text || "Untitled",
            company: company.charAt(0).toUpperCase() + company.slice(1),
            location: job.categories?.location || "Not specified",
            description: job.descriptionPlain?.substring(0, 500) || "",
            url: job.hostedUrl || job.applyUrl,
            salaryMin: null,
            salaryMax: null,
            postedDate: job.createdAt 
              ? new Date(job.createdAt).toISOString().split("T")[0] 
              : new Date().toISOString().split("T")[0],
          }));

        allJobs.push(...jobs);
      } catch (error) {
  // Silently skip companies that don't have public API (404) or timeouts
  // Uncomment below for debugging:
  // console.error(`Failed to fetch from ${company}:`, error instanceof Error ? error.message : "Unknown");
    }
    }

    return allJobs;
  },
};