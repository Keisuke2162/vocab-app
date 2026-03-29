import type { Word } from "./types";

const BASE = import.meta.env.VITE_API_URL as string;

export async function fetchTags(): Promise<string[]> {
  const res = await fetch(`${BASE}/words/tags`);
  if (!res.ok) throw new Error("Failed to fetch tags");
  const json = await res.json();
  return json.data as string[];
}

export async function fetchWords(tag?: string): Promise<Word[]> {
  const url = tag ? `${BASE}/words?tags=${encodeURIComponent(tag)}` : `${BASE}/words`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch words");
  const json = await res.json();
  return json.data as Word[];
}
