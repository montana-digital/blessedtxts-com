export interface Bookmark {
  id: string;
  ref: string;
  anchor: string;
  addedAt: number;
}

const PREFIX = 'fbv:bookmarks:';

function storageKey(versionId: string): string {
  return `${PREFIX}${versionId}`;
}

export function loadBookmarks(versionId: string): Bookmark[] {
  try {
    const raw = localStorage.getItem(storageKey(versionId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Bookmark[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(versionId: string, items: Bookmark[]): boolean {
  try {
    localStorage.setItem(storageKey(versionId), JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export function toggleBookmark(
  versionId: string,
  entry: Omit<Bookmark, 'addedAt'>,
): boolean {
  const list = loadBookmarks(versionId);
  const idx = list.findIndex((b) => b.id === entry.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    saveBookmarks(versionId, list);
    return false;
  }
  list.unshift({ ...entry, addedAt: Date.now() });
  saveBookmarks(versionId, list);
  return true;
}

export function isBookmarked(versionId: string, id: string): boolean {
  return loadBookmarks(versionId).some((b) => b.id === id);
}

