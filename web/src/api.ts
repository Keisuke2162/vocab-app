import type { Word, Article, ArticleWithWords, Tag, ExtractedWord } from "./types";

const BASE = import.meta.env.VITE_API_URL as string;

// ─── Unauthenticated ────────────────────────────────────────────────────────

async function publicFetch(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchTags(): Promise<string[]> {
  const json = await publicFetch(`${BASE}/words/tags`);
  return json.data as string[];
}

export async function fetchSources(): Promise<string[]> {
  const json = await publicFetch(`${BASE}/words/sources`);
  return json.data as string[];
}

export async function fetchWords(
  tag?: string,
  source?: string,
  userId?: string
): Promise<Word[]> {
  const params = new URLSearchParams();
  if (tag) params.set("tags", tag);
  if (source) params.set("source", source);
  if (userId) params.set("user_id", userId);
  const query = params.toString();
  const url = query ? `${BASE}/words?${query}` : `${BASE}/words`;
  const json = await publicFetch(url);
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

export async function deleteTag(token: string, id: string): Promise<void> {
  await authFetch(`${BASE}/tags/${id}`, token, { method: "DELETE" });
}

// ─── Words ──────────────────────────────────────────────────────────────────

export async function patchWord(
  token: string,
  id: string,
  data: { en?: string; ja?: string; tags?: string[]; quiz_enabled?: boolean }
): Promise<Word> {
  const json = await authFetch(`${BASE}/words/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return json.data as Word;
}

export async function deleteWord(token: string, id: string): Promise<void> {
  await authFetch(`${BASE}/words/${id}`, token, { method: "DELETE" });
}

export async function saveWord(
  token: string,
  data: { en: string; ja: string; tags: string[]; source?: string; article_id: string; quiz_enabled: boolean }
): Promise<Word> {
  const json = await authFetch(`${BASE}/words`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return json.data as Word;
}

// ─── Articles ───────────────────────────────────────────────────────────────

export async function fetchArticles(token: string): Promise<Article[]> {
  const json = await authFetch(`${BASE}/articles`, token);
  return json.data as Article[];
}

export async function fetchArticle(token: string, id: string): Promise<ArticleWithWords> {
  const json = await authFetch(`${BASE}/articles/${id}`, token);
  return json.data as ArticleWithWords;
}

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

export async function patchArticle(
  token: string,
  id: string,
  data: { commentary?: string }
): Promise<Article> {
  const json = await authFetch(`${BASE}/articles/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return json.data as Article;
}

export async function deleteArticle(token: string, id: string): Promise<void> {
  await authFetch(`${BASE}/articles/${id}`, token, { method: "DELETE" });
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

export async function extractCommentary(
  token: string,
  text: string
): Promise<string> {
  const json = await authFetch(`${BASE}/extract/commentary`, token, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return (json.data as { commentary: string }).commentary;
}
