const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Shared state (works across different computers)
let state = {
  verse: "",
  reference: "",
  fontSize: "60",
  book: "",
  chapter: "",
  verseNum: "",
  textColor: "#ffffff",
  bold: true,
  italic: false,
  shadowColor: "#000000",
  shadowIntensity: "70",
  dropShadowEnabled: false,
  dropShadowColor: "#000000",
  dropShadowIntensity: "50",
  borderEnabled: false,
  borderColor: "#000000",
  borderWidth: "2",
};

app.use(express.json());
app.use("/dock", express.static(path.join(__dirname, "../dock")));
app.use("/browser", express.static(path.join(__dirname, "../browser")));
app.use("/data", express.static(path.join(__dirname, "../data")));

app.get("/", (req, res) => {
  res.send("Kannada Bible OBS Server Running!");
});

app.get("/api/state", (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.json(state);
});

app.post("/api/state", (req, res) => {
  const b = req.body;
  if (b.verse !== undefined) state.verse = b.verse;
  if (b.fontSize !== undefined) state.fontSize = String(b.fontSize);
  if (b.textColor !== undefined) state.textColor = String(b.textColor);
  if (b.bold !== undefined) state.bold = Boolean(b.bold);
  if (b.italic !== undefined) state.italic = Boolean(b.italic);
  if (b.shadowColor !== undefined) state.shadowColor = String(b.shadowColor);
  if (b.shadowIntensity !== undefined) state.shadowIntensity = String(b.shadowIntensity);
  if (b.dropShadowEnabled !== undefined) state.dropShadowEnabled = Boolean(b.dropShadowEnabled);
  if (b.dropShadowColor !== undefined) state.dropShadowColor = String(b.dropShadowColor);
  if (b.dropShadowIntensity !== undefined) state.dropShadowIntensity = String(b.dropShadowIntensity);
  if (b.borderEnabled !== undefined) state.borderEnabled = Boolean(b.borderEnabled);
  if (b.borderColor !== undefined) state.borderColor = String(b.borderColor);
  if (b.borderWidth !== undefined) state.borderWidth = String(b.borderWidth);
  if (b.book && b.chapter != null && b.verseNum != null) {
    state.book = String(b.book);
    state.chapter = String(b.chapter);
    state.verseNum = String(b.verseNum);
    state.reference = `${state.book} ${state.chapter}:${state.verseNum}`;
  } else if (b.reference !== undefined) {
    state.reference = b.reference;
  }
  res.set("Cache-Control", "no-store");
  res.json(state);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`Dock UI: http://localhost:${PORT}/dock/`);
  console.log(`Browser Output: http://localhost:${PORT}/browser/`);
  console.log(`On another PC, use: http://<this-pc-ip>:${PORT}/dock/`);
});
