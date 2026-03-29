import { useEffect, useState } from "react";
import type { Word } from "../types";
import { fetchWords, fetchTags } from "../api";

export default function WordList() {
  const [words, setWords] = useState<Word[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tag, setTag] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTags().then(setTags).catch(() => {});
  }, []);

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
        {(["all", ...tags]).map((t) => (
          <button
            key={t}
            className={tag === t ? "active" : ""}
            onClick={() => setTag(t)}
          >
            {t === "all" ? "すべて" : t}
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
            </tr>
          </thead>
          <tbody>
            {words.map((w) => (
              <tr key={w.id}>
                <td>{w.en}</td>
                <td>{w.ja}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
