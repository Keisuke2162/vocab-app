import { useEffect, useState } from "react";
import type { Word } from "../types";
import { fetchWords } from "../api";

type Tag = "all" | "swift" | "news";

const TAG_LABELS: Record<Tag, string> = {
  all: "すべて",
  swift: "swift",
  news: "news",
};

export default function WordList() {
  const [words, setWords] = useState<Word[]>([]);
  const [tag, setTag] = useState<Tag>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchWords(tag === "all" ? undefined : tag)
      .then(setWords)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tag]);

  return (
    <div>
      <div className="filter-bar">
        {(["all", "swift", "news"] as Tag[]).map((t) => (
          <button
            key={t}
            className={tag === t ? "active" : ""}
            onClick={() => setTag(t)}
          >
            {TAG_LABELS[t]}
          </button>
        ))}
      </div>

      {loading && <p className="status">読み込み中...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && words.length > 0 && (
        <p className="word-count">{words.length} 件</p>
      )}

      {!loading && (
        <table className="word-table">
          <thead>
            <tr>
              <th>英語</th>
              <th>日本語</th>
              <th>タグ</th>
            </tr>
          </thead>
          <tbody>
            {words.map((w) => (
              <tr key={w.id}>
                <td>{w.en}</td>
                <td>{w.ja}</td>
                <td className="tags">{w.tags.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
