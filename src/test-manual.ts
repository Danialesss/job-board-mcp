import { searchJobs } from "./tools/searchJobs.js";
import { initializeCache } from "./datasources/cache.js";

async function runTest() {
  console.log("🧪 Testing MCP Job Board Server\n");
  console.log("=".repeat(50));

  initializeCache();

  console.log("\n📍 Test 1: Searching for 'Engineer' jobs (Remote) - up to 20 results...\n");
  const searchResult = await searchJobs({
    query: "Engineer",
    location: "Remote",
    limit: 20,
  });
  console.log(searchResult.content[0].text);

  console.log("\n" + "=".repeat(50));
  console.log("\n✅ Tests complete!\n");
}

runTest().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});