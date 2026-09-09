import { 
  initializeCache, 
  cacheJob, 
  getJobFromCache, 
  searchCache,
  Job 
} from "../src/datasources/cache.js";

describe("Cache Layer", () => {
  beforeAll(() => {
    // Use in-memory DB for tests
    process.env.DB_PATH = ":memory:";
    initializeCache();
  });

  const sampleJob: Job = {
    id: "test-job-1",
    source: "test",
    title: "Cloud Engineer",
    company: "TestCorp",
    location: "Remote",
    description: "A great cloud engineering role",
    url: "https://example.com/job/1",
    salaryMin: 80000,
    salaryMax: 120000,
    postedDate: "2026-09-01",
  };

  test("cacheJob stores a job successfully", () => {
    expect(() => cacheJob(sampleJob)).not.toThrow();
  });

  test("getJobFromCache retrieves a cached job", () => {
    cacheJob(sampleJob);
    const retrieved = getJobFromCache("test-job-1");
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.title).toBe("Cloud Engineer");
    expect(retrieved?.company).toBe("TestCorp");
  });

  test("getJobFromCache returns undefined for non-existent job", () => {
    const result = getJobFromCache("does-not-exist");
    expect(result).toBeUndefined();
  });

  test("searchCache finds jobs by title", () => {
    cacheJob(sampleJob);
    const results = searchCache("Cloud");
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain("Cloud");
  });

  test("searchCache filters by location", () => {
    cacheJob(sampleJob);
    const results = searchCache("Engineer", "Remote");
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].location).toBe("Remote");
  });

  test("searchCache respects limit parameter", () => {
    // Cache multiple jobs
    for (let i = 0; i < 5; i++) {
      cacheJob({
        ...sampleJob,
        id: `test-job-${i}`,
        title: `Cloud Engineer ${i}`,
      });
    }
    
    const results = searchCache("Cloud", undefined, 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  test("cacheJob handles duplicate IDs (upsert)", () => {
    cacheJob(sampleJob);
    cacheJob({ ...sampleJob, title: "Updated Title" });
    
    const retrieved = getJobFromCache("test-job-1");
    expect(retrieved?.title).toBe("Updated Title");
  });
});