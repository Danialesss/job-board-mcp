import axios from "axios";
import { Job } from "../cache.js";

export const remoteOkApi = {
  async searchJobs(query: string, location: string): Promise<Job[]> {
    try {
      // RemoteOK returns all remote jobs, we filter client-side
      const response = await axios.get(
        "https://remoteok.com/api",
        { 
          timeout: 8000,
          headers: {
            "User-Agent": "JobBoardMCP/1.0",
          },
        }
      );

      // First item is metadata, skip it
      const jobs = response.data.slice(1);

      // RemoteOK is remote-only, so ignore location filter unless it's remote
      const isRemoteSearch = location.toLowerCase() === "remote" || location === "";

      if (!isRemoteSearch) {
        return []; // No non-remote jobs here
      }

      return jobs
        .filter((job: any) => {
          const searchText = `${job.position || ""} ${job.description || ""} ${(job.tags || []).join(" ")}`.toLowerCase();
          return searchText.includes(query.toLowerCase());
        })
        .slice(0, 20) // Limit to prevent flooding cache
        .map((job: any) => ({
          id: `remoteok-${job.id}`,
          source: "remoteok",
          title: job.position || "Untitled",
          company: job.company || "Unknown",
          location: "Remote",
          description: job.description?.substring(0, 500) || "",
          url: job.url || job.apply_url,
          salaryMin: job.salary_min || null,
          salaryMax: job.salary_max || null,
          postedDate: job.date 
            ? new Date(job.date).toISOString().split("T")[0] 
            : new Date().toISOString().split("T")[0],
        }));
    } catch (error) {
  return [];
}
  },
};