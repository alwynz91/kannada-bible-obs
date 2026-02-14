let bibleData = {};

async function loadBible() {
  const res = await fetch("../data/bible.json");
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
  const parts = input.split(" ");

  if (parts.length < 2) {
    verseList.innerHTML = `<p style="color:red;">Type like: Genesis 1</p>`;
    return;
  }

  const book = parts[0];
  const chapter = parts[1];

  verseList.innerHTML = "";

  const chapterData = bibleData[book]?.[chapter];

  if (!chapterData) {
    verseList.innerHTML = `<p style="color:red;">Not found: ${book} ${chapter}</p>`;
    return;
  }

  Object.keys(chapterData).forEach((verseNum) => {
    const verseText = chapterData[verseNum];

    const div = document.createElement("div");
    div.className = "verseItem";
    div.innerHTML = `<b>${verseNum}</b> - ${verseText}`;

    div.onclick = () => {
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verse: verseText }),
      });
    };

    verseList.appendChild(div);
  });
}
