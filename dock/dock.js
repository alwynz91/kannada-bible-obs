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

function booksMatchingPrefix(query) {
  if (!bibleData || !query.trim()) return [];
  const n = normalizeBookName(query);
  return Object.keys(bibleData)
    .filter((b) => normalizeBookName(b).startsWith(n))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .slice(0, 14);
}

function shouldHideSuggestionsForQuery(q) {
  const parts = q.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1]);
}

const searchInput = document.getElementById("searchInput");
const verseList = document.getElementById("verseList");
const fontSizeSlider = document.getElementById("fontSize");
const suggestPanel = document.getElementById("suggestPanel");
const dockToast = document.getElementById("dockToast");

function hideSuggestions() {
  if (suggestPanel) {
    suggestPanel.classList.add("hidden");
    suggestPanel.replaceChildren();
  }
}

function updateSuggestions() {
  if (!suggestPanel || !bibleData) return;
  const q = searchInput.value;
  if (shouldHideSuggestionsForQuery(q)) {
    hideSuggestions();
    return;
  }
  const matches = booksMatchingPrefix(q.trim());
  suggestPanel.replaceChildren();
  if (matches.length === 0) {
    suggestPanel.classList.add("hidden");
    return;
  }
  matches.forEach((name) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "suggest-item";
    btn.textContent = name;
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      searchInput.value = name;
      hideSuggestions();
      searchInput.focus();
    });
    suggestPanel.appendChild(btn);
  });
  suggestPanel.classList.remove("hidden");
}

searchInput.addEventListener("input", updateSuggestions);
searchInput.addEventListener("focus", updateSuggestions);

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hideSuggestions();
    return;
  }
  if (e.key === "Enter") {
    hideSuggestions();
    e.preventDefault();
    void searchChapter();
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap")) hideSuggestions();
});

fontSizeSlider.addEventListener("input", () => {
  const size = fontSizeSlider.value;
  fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ fontSize: size }),
  });
});

function isTypableField(el) {
  if (!el || !el.tagName) return false;
  const t = el.tagName.toLowerCase();
  if (t === "textarea") return true;
  if (t === "input") {
    const type = (el.type || "").toLowerCase();
    if (type === "range" || type === "button" || type === "checkbox" || type === "radio") return false;
    return true;
  }
  return Boolean(el.isContentEditable);
}

function getAllVerseListText() {
  const items = verseList.querySelectorAll(".verseItem");
  if (!items.length) return "";
  return Array.from(items)
    .map((el) => el.innerText.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");
}

function showToast(msg) {
  if (!dockToast) return;
  dockToast.textContent = msg;
  dockToast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => dockToast.classList.remove("show"), 2000);
}

document.addEventListener("keydown", async (e) => {
  const mod = e.metaKey || e.ctrlKey;
  if (!mod) return;
  const k = e.key.toLowerCase();
  if (k !== "a") return;
  if (isTypableField(e.target)) return;

  const text = getAllVerseListText();
  if (!text) return;

  e.preventDefault();
  try {
    await navigator.clipboard.writeText(text);
    const n = verseList.querySelectorAll(".verseItem").length;
    showToast(`Copied ${n} verse${n === 1 ? "" : "s"} to clipboard`);
  } catch (err) {
    showToast("Could not copy (clipboard blocked?)");
  }
});

function appendBackToChapters(book) {
  const nav = document.createElement("div");
  nav.className = "dock-nav";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "dock-back";
  btn.textContent = "← Chapters";
  btn.onclick = () => showChapters(book);
  nav.appendChild(btn);
  verseList.appendChild(nav);
}

function showChapters(book) {
  hideSuggestions();
  verseList.innerHTML = "";
  searchInput.value = book;

  const hint = document.createElement("p");
  hint.className = "dock-hint";
  hint.textContent = `${book} — tap a chapter`;
  verseList.appendChild(hint);

  const grid = document.createElement("div");
  grid.className = "chapterGrid";

  const chapters = Object.keys(bibleData[book]).sort((a, b) => Number(a) - Number(b));
  chapters.forEach((ch) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chapterItem";
    btn.textContent = ch;
    btn.title = `${book} ${ch}`;
    btn.onclick = () => {
      searchInput.value = `${book} ${ch}`;
      showVerses(book, ch);
    };
    grid.appendChild(btn);
  });

  verseList.appendChild(grid);
}

function showVerses(book, chapter) {
  hideSuggestions();
  const chapterData = bibleData[book]?.[chapter];
  verseList.innerHTML = "";

  if (!chapterData) {
    verseList.innerHTML = `<p style="color:red;">No verses for <b>${book}</b> chapter <b>${chapter}</b></p>`;
    return;
  }

  searchInput.value = `${book} ${chapter}`;

  appendBackToChapters(book);

  const sub = document.createElement("p");
  sub.className = "dock-hint";
  sub.textContent = `${book} ${chapter} — tap a verse`;
  verseList.appendChild(sub);

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

async function searchChapter() {
  await bibleReady;
  hideSuggestions();

  if (bibleLoadError || !bibleData) {
    verseList.innerHTML = `<p style="color:red;">Bible data is not available. Refresh the page.</p>`;
    return;
  }

  const input = searchInput.value.trim();
  const parts = input.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    verseList.innerHTML = `<p style="color:red;">Type a book name (e.g. <b>Genesis</b> or <b>1 Kings</b>) or <b>Genesis 5</b> for a chapter.</p>`;
    return;
  }

  const last = parts[parts.length - 1];
  const endsWithChapter = /^\d+$/.test(last);

  if (endsWithChapter && parts.length >= 2) {
    const chapter = last;
    const bookInput = parts.slice(0, -1).join(" ");
    const book = findBook(bookInput);
    if (!book) {
      verseList.innerHTML = `<p style="color:red;">Unknown book: <b>${bookInput}</b></p>`;
      return;
    }
    showVerses(book, chapter);
    return;
  }

  const bookInput = parts.join(" ");
  const book = findBook(bookInput);
  if (!book) {
    verseList.innerHTML = `<p style="color:red;">Unknown book: <b>${bookInput}</b></p>`;
    return;
  }

  showChapters(book);
}
