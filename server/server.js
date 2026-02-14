const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Shared state (works across different computers)
let state = { verse: "", fontSize: "60" };

app.use(express.json());
app.use("/dock", express.static(path.join(__dirname, "../dock")));
app.use("/browser", express.static(path.join(__dirname, "../browser")));
app.use("/data", express.static(path.join(__dirname, "../data")));

app.get("/", (req, res) => {
  res.send("Kannada Bible OBS Server Running!");
});

app.get("/api/state", (req, res) => {
  res.json(state);
});

app.post("/api/state", (req, res) => {
  if (req.body.verse !== undefined) state.verse = req.body.verse;
  if (req.body.fontSize !== undefined) state.fontSize = req.body.fontSize;
  res.json(state);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`Dock UI: http://localhost:${PORT}/dock/`);
  console.log(`Browser Output: http://localhost:${PORT}/browser/`);
  console.log(`On another PC, use: http://<this-pc-ip>:${PORT}/dock/`);
});
