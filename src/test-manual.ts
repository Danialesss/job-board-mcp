import { searchJobs } from "./tools/searchJobs.js";
import { getJobDetails } from "./tools/getJobDetails.js";
import { initializeCache } from "./datasources/cache.js";

async function runTest() {
  console.log("🧪 Testing MCP Job Board Server\n");
  console.log("=" .repeat(50));

  // Initialize cache
  initializeCache();

  // Test 1: Search for jobs
  console.log("\n📍 Test 1: Searching for 'Engineer' jobs (Remote)...\n");
  const searchResult = await searchJobs({
    query: "Engineer",
    location: "Remote",
    limit: 5,
  });
  console.log(searchResult.content[0].text);

  console.log("\n" + "=".repeat(50));

  // Test 2: Search for something more specific
  console.log("\n📍 Test 2: Searching for 'Software' jobs...\n");
  const softwareResult = await searchJobs({
    query: "Software",
    location: "Remote",
    limit: 3,
  });
  console.log(softwareResult.content[0].text);

  console.log("\n" + "=".repeat(50));
  console.log("\n✅ Tests complete!\n");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});