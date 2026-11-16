/**
 * Opens the site search from anywhere (the rail's „Szukaj”, the capsule, the Menu sheet) without a
 * shared React tree — pattern: prokom-web-hub `lib/site/searchOpen.ts`. The window listens, any
 * button asks; `query` comes already typed (popular phrases).
 */
const listeners = new Set<(query?: string) => void>();

export function onSearchRequest(listener: (query?: string) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function requestSearch(query?: string): void {
  listeners.forEach((listener) => listener(query));
}
