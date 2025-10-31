import { spawn } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { parseStringPromise } from "xml2js";

// Automatically timestamp each test run for historical tracking
const now = new Date();
const timestamp = now
  .toISOString()
  .replace(/T/, "_")
  .replace(/:/g, "-")
  .replace(/\..+/, ""); 

const xmlFile = `./test-report-${timestamp}.xml`;
const jsonFile = `./test-report-${timestamp}.json`;

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
    // XML'i oku
    const xmlData = readFileSync(xmlFile, "utf-8");

    // JSON'a dönüştür
    const jsonReport = await parseStringPromise(xmlData, { explicitArray: false });

    // JSON dosyasını kaydet
    writeFileSync(jsonFile, JSON.stringify(jsonReport, null, 2));

    console.log(`✅ Test raporu kaydedildi: ${jsonFile}`);
  } catch (err) {
    console.error("❌ Rapor oluşturulamadı:", err.message);
  }
  console.log(`🧾 Çıkış kodu: ${code}`);
});
