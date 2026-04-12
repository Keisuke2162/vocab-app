import { useEffect, useState, useMemo } from "react";
import type { Word } from "../types";
import { fetchWords, patchWord, deleteWord } from "../api";
import { useAuth } from "../contexts/AuthContext";

export default function WordList() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";
  const userId = session?.user.id;

  const [allWords, setAllWords] = useState<Word[]>([]);
  const [tag, setTag] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEn, setEditEn] = useState("");
  const [editJa, setEditJa] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchWords(undefined, undefined, userId)
      .then(setAllWords)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const tags = useMemo(
    () => [...new Set(allWords.flatMap((w) => w.tags))].sort(),
    [allWords]
  );

  const words = useMemo(
    () => (tag === "all" ? allWords : allWords.filter((w) => w.tags.includes(tag))),
    [allWords, tag]
  );

  const handleToggleQuiz = async (word: Word) => {
    const updated = await patchWord(token, word.id, { quiz_enabled: !word.quiz_enabled });
    setAllWords((prev) => prev.map((w) => (w.id === word.id ? updated : w)));
  };

  const startEdit = (word: Word) => {
    setEditingId(word.id);
    setEditEn(word.en);
    setEditJa(word.ja);
  };

  const handleSaveEdit = async (id: string) => {
    const updated = await patchWord(token, id, { en: editEn, ja: editJa });
    setAllWords((prev) => prev.map((w) => (w.id === id ? updated : w)));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("この単語を削除しますか？")) return;
    await deleteWord(token, id);
    setAllWords((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div>
      <div className="filter-bar">
        {["all", ...tags].map((t) => (
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
              <th>クイズ</th>
              <th>英語</th>
              <th>日本語</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {words.map((w) =>
              editingId === w.id ? (
                <tr key={w.id}>
                  <td className="quiz-check">
                    <input type="checkbox" checked={w.quiz_enabled} readOnly />
                  </td>
                  <td>
                    <input
                      className="inline-edit"
                      value={editEn}
                      onChange={(e) => setEditEn(e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="inline-edit"
                      value={editJa}
                      onChange={(e) => setEditJa(e.target.value)}
                    />
                  </td>
                  <td className="row-actions">
                    <button className="btn-save-sm" onClick={() => handleSaveEdit(w.id)}>保存</button>
                    <button className="btn-cancel-sm" onClick={() => setEditingId(null)}>キャンセル</button>
                  </td>
                </tr>
              ) : (
                <tr key={w.id} className={w.quiz_enabled ? "" : "quiz-off"}>
                  <td className="quiz-check">
                    <input
                      type="checkbox"
                      checked={w.quiz_enabled}
                      onChange={() => handleToggleQuiz(w)}
                    />
                  </td>
                  <td>{w.en}</td>
                  <td>{w.ja}</td>
                  <td className="row-actions">
                    <button className="btn-edit-sm" onClick={() => startEdit(w)}>編集</button>
                    <button className="btn-delete-sm" onClick={() => handleDelete(w.id)}>削除</button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
