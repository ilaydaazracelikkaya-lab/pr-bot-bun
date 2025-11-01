import { spawn } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { parseStringPromise } from "xml2js";

// Create test-result directory if it doesn't exist
const outputDir = "./test-result";
if (!existsSync(outputDir)) mkdirSync(outputDir);

// Generate a dynamic timestamp
const now = new Date();
const timestamp = now
  .toISOString()
  .replace(/T/, "_")
  .replace(/:/g, "-")
  .replace(/\..+/, "");

// Define output file paths
const xmlFile = `${outputDir}/test-report-${timestamp}.xml`;
const jsonFile = `${outputDir}/test-report-${timestamp}.json`;

// Run Bun tests and generate XML report
const process = spawn(
  "bun",
  ["test", "--reporter=junit", "--reporter-outfile", xmlFile],
  { shell: true }
);

process.stdout.on("data", (data) => {
  console.log(data.toString());
});

process.stderr.on("data", (data) => {
  console.error(data.toString());
});

process.on("close", async (code) => {
  try {
    const xmlData = readFileSync(xmlFile, "utf-8");
    const jsonReport = await parseStringPromise(xmlData, { explicitArray: false });
    writeFileSync(jsonFile, JSON.stringify(jsonReport, null, 2));
    console.log(`Test reports saved in ${outputDir}/`);
  } catch (err) {
    console.error("Failed to read or convert report:", err.message);
  }
  console.log(`Exit code: ${code}`);
});
