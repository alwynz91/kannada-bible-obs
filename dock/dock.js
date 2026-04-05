let bibleData = null;
let bibleLoadError = null;

const bibleReady = (async function loadBible() {
  const list = document.getElementById("verseList");
  if (list) list.innerHTML = "<p>Loading Bible…</p>";
  try {
    const res = await fetch("../data/bible.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    bibleData = await res.json();
    if (!bibleData || typeof bibleData !== "object" || Array.isArray(bibleData)) {
      throw new Error("Invalid bible.json shape");
    }
    if (list) list.innerHTML = "";
  } catch (e) {
    bibleLoadError = e;
    bibleData = null;
    if (list) {
      list.innerHTML = `<p style="color:red;">Could not load bible.json (${e.message}). Check the network tab or refresh.</p>`;
    }
  }
})();

function normalizeBookName(s) {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function findBook(bookInput) {
  if (!bibleData) return undefined;
  const want = normalizeBookName(bookInput);
  return Object.keys(bibleData).find((b) => normalizeBookName(b) === want);
}

const searchInput = document.getElementById("searchInput");
const verseList = document.getElementById("verseList");
const fontSizeSlider = document.getElementById("fontSize");

fontSizeSlider.addEventListener("input", () => {
  const size = fontSizeSlider.value;
  fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ fontSize: size }),
  });
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    void searchChapter();
  }
});

async function searchChapter() {
  await bibleReady;

  if (bibleLoadError || !bibleData) {
    verseList.innerHTML = `<p style="color:red;">Bible data is not available. Refresh the page.</p>`;
    return;
  }

  const input = searchInput.value.trim();
  const parts = input.split(/\s+/).filter(Boolean);

  if (parts.length < 2) {
    verseList.innerHTML = `<p style="color:red;">Type book then chapter, e.g. <b>Genesis 1</b> or <b>1 Kings 5</b></p>`;
    return;
  }

  const chapter = parts[parts.length - 1];
  if (!/^\d+$/.test(chapter)) {
    verseList.innerHTML = `<p style="color:red;">End with chapter number, e.g. <b>1 Kings 5</b></p>`;
    return;
  }

  const bookInput = parts.slice(0, -1).join(" ");
  const book = findBook(bookInput);

  verseList.innerHTML = "";

  const chapterData = book ? bibleData[book]?.[chapter] : null;

  if (!chapterData) {
    verseList.innerHTML = `<p style="color:red;">Not found: <b>${bookInput}</b> chapter <b>${chapter}</b></p>`;
    return;
  }

  const verseNums = Object.keys(chapterData).sort((a, b) => Number(a) - Number(b));

  verseNums.forEach((verseNum) => {
    const verseText = chapterData[verseNum];

    const div = document.createElement("div");
    div.className = "verseItem";
    div.innerHTML = `<b>${verseNum}</b> - ${verseText}`;

    div.onclick = () => {
      const reference = `${book} ${chapter}:${verseNum}`;
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          verse: verseText,
          reference,
          book,
          chapter: String(chapter),
          verseNum: String(verseNum),
        }),
      });
    };

    verseList.appendChild(div);
  });
}
