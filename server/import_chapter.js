const fs = require("fs");
const path = require("path");

const rawFolder = path.join(__dirname, "../data/raw");
const outputFile = path.join(__dirname, "../data/bible.json");

let bible = {};

// Load existing bible.json if it exists
if (fs.existsSync(outputFile)) {
  bible = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
}

function importChapter(book, chapter) {
  const fileName = `${book}_${chapter}.txt`;
  const filePath = path.join(rawFolder, fileName);

  if (!fs.existsSync(filePath)) {
    console.log("❌ File not found:", filePath);
    return;
  }

  const lines = fs.readFileSync(filePath, "utf-8")
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (!bible[book]) bible[book] = {};
  if (!bible[book][chapter]) bible[book][chapter] = {};

  lines.forEach(line => {
    const match = line.match(/^(\d+)\s+(.*)$/);
    if (match) {
      const verseNum = match[1];
      const verseText = match[2];
      bible[book][chapter][verseNum] = verseText;
    }
  });

  fs.writeFileSync(outputFile, JSON.stringify(bible, null, 2), "utf-8");
  console.log(`✅ Imported ${book} Chapter ${chapter} successfully!`);
}

// Example: Import Genesis 1
importChapter("Genesis", "1");
