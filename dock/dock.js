let bibleData = {};

async function loadBible() {
  const res = await fetch("../data/bible.json", { cache: "no-store" });
  bibleData = await res.json();
}

loadBible();

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
    searchChapter();
  }
});

function searchChapter() {
  const input = searchInput.value.trim();
  const parts = input.split(/\s+/).filter(Boolean);

  if (parts.length < 2) {
    verseList.innerHTML = `<p style="color:red;">Type like: Genesis 1</p>`;
    return;
  }

  const bookInput = parts[0];
  const chapter = parts[1];

  const book = Object.keys(bibleData).find(
    (b) => b.toLowerCase() === bookInput.toLowerCase()
  );

  verseList.innerHTML = "";

  const chapterData = book ? bibleData[book]?.[chapter] : null;

  if (!chapterData) {
    verseList.innerHTML = `<p style="color:red;">Not found: ${bookInput} ${chapter}</p>`;
    return;
  }

  Object.keys(chapterData).forEach((verseNum) => {
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
