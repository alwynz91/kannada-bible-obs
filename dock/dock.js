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

/** Catholic Bible order (matches data/bible.json key order after merge). */
const BOOK_ORDER = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Tobit",
  "Judith",
  "Esther",
  "1 Maccabees",
  "2 Maccabees",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Songs",
  "Wisdom",
  "Sirach",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Baruch",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
];

function normalizeBookName(s) {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function bookCanonIndex(name) {
  const n = normalizeBookName(name);
  const i = BOOK_ORDER.findIndex((b) => normalizeBookName(b) === n);
  return i === -1 ? 10000 : i;
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
    .sort((a, b) => {
      const da = bookCanonIndex(a) - bookCanonIndex(b);
      if (da !== 0) return da;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
}

function shouldHideGhostForQuery(q) {
  const parts = q.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 && /^\d+$/.test(parts[parts.length - 1]);
}

/** Suffix of `completion` that extends `typedBook` (case-insensitive char match). */
function ghostSuffix(typedBook, completion) {
  const a = typedBook;
  const b = completion;
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i].toLowerCase() === b[j].toLowerCase()) {
      i++;
      j++;
    } else {
      return "";
    }
  }
  if (i !== a.length) return "";
  return b.slice(j);
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const searchInput = document.getElementById("searchInput");
const verseList = document.getElementById("verseList");
const fontSizeSlider = document.getElementById("fontSize");
const searchMirror = document.getElementById("searchMirror");
const dockToast = document.getElementById("dockToast");

function syncSearchMirrorScroll() {
  if (searchMirror && searchInput) searchMirror.scrollLeft = searchInput.scrollLeft;
}

function updateInlineMirror() {
  if (!searchMirror || !searchInput) return;
  const val = searchInput.value;
  if (!bibleData) {
    searchMirror.innerHTML = escapeHtml(val);
    syncSearchMirrorScroll();
    return;
  }
  if (shouldHideGhostForQuery(val)) {
    searchMirror.innerHTML = escapeHtml(val);
    syncSearchMirrorScroll();
    return;
  }
  const bookPart = val.trim();
  if (!bookPart) {
    searchMirror.innerHTML = escapeHtml(val);
    syncSearchMirrorScroll();
    return;
  }
  const matches = booksMatchingPrefix(bookPart);
  const first = matches[0];
  const ghost = first ? ghostSuffix(bookPart, first) : "";
  if (!ghost || normalizeBookName(bookPart) === normalizeBookName(first)) {
    searchMirror.innerHTML = escapeHtml(val);
    syncSearchMirrorScroll();
    return;
  }
  searchMirror.innerHTML = `${escapeHtml(val)}<span class="mirror-ghost">${escapeHtml(ghost)}</span>`;
  syncSearchMirrorScroll();
}

function expandBookPrefixIfNeeded() {
  if (!bibleData) return;
  const trimmed = searchInput.value.trim();
  if (!trimmed) return;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const last = parts[parts.length - 1];
  if (/^\d+$/.test(last) && parts.length >= 2) {
    const bookPart = parts.slice(0, -1).join(" ");
    if (findBook(bookPart)) return;
    const matches = booksMatchingPrefix(bookPart);
    if (matches[0]) {
      searchInput.value = `${matches[0]} ${last}`;
      updateInlineMirror();
    }
    return;
  }
  const bookPart = parts.join(" ");
  if (findBook(bookPart)) return;
  const matches = booksMatchingPrefix(bookPart);
  if (matches[0]) {
    searchInput.value = matches[0];
    updateInlineMirror();
  }
}

function acceptGhostCompletion() {
  if (!bibleData) return false;
  const val = searchInput.value;
  if (shouldHideGhostForQuery(val)) return false;
  const bookPart = val.trim();
  const matches = booksMatchingPrefix(bookPart);
  const first = matches[0];
  if (!first) return false;
  const ghost = ghostSuffix(bookPart, first);
  if (!ghost || normalizeBookName(bookPart) === normalizeBookName(first)) return false;
  searchInput.value = first;
  updateInlineMirror();
  return true;
}

searchInput.addEventListener("input", () => {
  updateInlineMirror();
});
searchInput.addEventListener("focus", () => {
  updateInlineMirror();
});
searchInput.addEventListener("scroll", syncSearchMirrorScroll);

function isStandardEditShortcut(e) {
  if (!e.metaKey && !e.ctrlKey) return false;
  const k = e.key.toLowerCase();
  // Select all, copy, paste, cut, undo, redo (Mac often uses ⌘⇧Z).
  if (k === "a" || k === "c" || k === "v" || k === "x" || k === "z" || k === "y") return true;
  // Move caret / extend selection by word or line (common OS bindings).
  if (k === "arrowleft" || k === "arrowright" || k === "arrowup" || k === "arrowdown") return true;
  if (k === "home" || k === "end" || k === "backspace" || k === "delete") return true;
  return false;
}

searchInput.addEventListener("keydown", (e) => {
  if (isStandardEditShortcut(e)) return;

  if (e.key === "Tab" && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
    if (acceptGhostCompletion()) {
      e.preventDefault();
    }
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    void searchChapter();
  }
});

searchInput.addEventListener("cut", () => {
  queueMicrotask(() => updateInlineMirror());
});
searchInput.addEventListener("paste", () => {
  queueMicrotask(() => updateInlineMirror());
});
searchInput.addEventListener("keyup", (e) => {
  if (isStandardEditShortcut(e)) updateInlineMirror();
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
  updateInlineMirror();
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
  updateInlineMirror();
}

function showVerses(book, chapter) {
  updateInlineMirror();
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
  updateInlineMirror();
}

async function searchChapter() {
  await bibleReady;
  updateInlineMirror();

  if (bibleLoadError || !bibleData) {
    verseList.innerHTML = `<p style="color:red;">Bible data is not available. Refresh the page.</p>`;
    return;
  }

  expandBookPrefixIfNeeded();

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

bibleReady.then(() => updateInlineMirror());
