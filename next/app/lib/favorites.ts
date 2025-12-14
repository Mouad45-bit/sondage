// app/lib/favorites.ts

const FAVORITES_KEY = "nosql_favorites";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function isFavorite(pollId: string): boolean {
  return getFavorites().includes(pollId);
}

export function toggleFavorite(pollId: string): string[] {
  const favs = new Set(getFavorites());
  if (favs.has(pollId)) favs.delete(pollId);
  else favs.add(pollId);
  const next = Array.from(favs);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}