import type { Word, Article, Tag, ExtractedWord } from "./types";

const BASE = import.meta.env.VITE_API_URL as string;

// ─── Unauthenticated ────────────────────────────────────────────────────────

export async function fetchTags(): Promise<string[]> {
  const res = await fetch(`${BASE}/words/tags`);
  if (!res.ok) throw new Error("Failed to fetch tags");
  const json = await res.json();
  return json.data as string[];
}

export async function fetchSources(): Promise<string[]> {
  const res = await fetch(`${BASE}/words/sources`);
  if (!res.ok) throw new Error("Failed to fetch sources");
  const json = await res.json();
  return json.data as string[];
}

export async function fetchWords(tag?: string, source?: string): Promise<Word[]> {
  const params = new URLSearchParams();
  if (tag) params.set("tags", tag);
  if (source) params.set("source", source);
  const query = params.toString();
  const url = query ? `${BASE}/words?${query}` : `${BASE}/words`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch words");
  const json = await res.json();
  return json.data as Word[];
}

// ─── Authenticated helpers ──────────────────────────────────────────────────

async function authFetch(url: string, token: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Tags ───────────────────────────────────────────────────────────────────

export async function fetchUserTags(token: string): Promise<Tag[]> {
  const json = await authFetch(`${BASE}/tags`, token);
  return json.data as Tag[];
}

export async function createTag(token: string, name: string): Promise<Tag> {
  const json = await authFetch(`${BASE}/tags`, token, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return json.data as Tag;
}

// ─── Extract ────────────────────────────────────────────────────────────────

export async function extractWords(
  token: string,
  text: string
): Promise<ExtractedWord[]> {
  const json = await authFetch(`${BASE}/extract/words`, token, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  const words = (json.data as { words: { en: string; ja: string }[] }).words;
  return words.map((w) => ({ ...w, quiz_enabled: true }));
}

// ─── Articles ───────────────────────────────────────────────────────────────

export async function saveArticle(
  token: string,
  data: { title: string; input_type: "text" | "link"; original_text?: string; url?: string }
): Promise<Article> {
  const json = await authFetch(`${BASE}/articles`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data as Article;
}

// ─── Words ──────────────────────────────────────────────────────────────────

export async function saveWord(
  token: string,
  data: { en: string; ja: string; tags: string[]; article_id: string; quiz_enabled: boolean }
): Promise<Word> {
  const json = await authFetch(`${BASE}/words`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data as Word;
}
