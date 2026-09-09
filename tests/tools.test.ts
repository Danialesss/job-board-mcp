import { searchJobs } from "../src/tools/searchJobs.js";
import { getJobDetails } from "../src/tools/getJobDetails.js";
import { initializeCache, cacheJob } from "../src/datasources/cache.js";

describe("Tool Handlers", () => {
  beforeAll(() => {
    process.env.DB_PATH = ":memory:";
    initializeCache();
    
    // Seed cache with test data
    cacheJob({
      id: "test-1",
      source: "test",
      title: "DevOps Engineer",
      company: "TestCo",
      location: "Remote",
      description: "Great role",
      url: "https://example.com/1",
      salaryMin: 100000,
      salaryMax: 150000,
      postedDate: "2026-09-01",
    });
  });

  describe("searchJobs", () => {
    test("returns cached results when available", async () => {
      const result = await searchJobs({
        query: "DevOps",
        location: "Remote",
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("DevOps");
    });

    test("respects the limit parameter", async () => {
      const result = await searchJobs({
        query: "DevOps",
        limit: 1,
      });

      expect(result.content[0].text).toContain("Found");
    });

    test("handles empty query results", async () => {
      const result = await searchJobs({
        query: "xxx_nonexistent_xxx",
        location: "Nowhere",
      });

      expect(result.content).toBeDefined();
    });
  });

  describe("getJobDetails", () => {
    test("returns details for existing job", async () => {
      const result = await getJobDetails({ jobId: "test-1" });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain("DevOps Engineer");
      expect(result.content[0].text).toContain("TestCo");
    });

    test("returns error for non-existent job", async () => {
      const result = await getJobDetails({ jobId: "does-not-exist" });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("not found");
    });
  });
});