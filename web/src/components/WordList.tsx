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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = words.length > 0 && words.every((w) => selectedIds.has(w.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        words.forEach((w) => next.delete(w.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        words.forEach((w) => next.add(w.id));
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`選択した ${selectedIds.size} 件の単語を削除しますか？`)) return;
    await Promise.all([...selectedIds].map((id) => deleteWord(token, id)));
    setAllWords((prev) => prev.filter((w) => !selectedIds.has(w.id)));
    setSelectedIds(new Set());
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
        <div className="word-list-toolbar">
          <p className="word-count">{words.length} 件</p>
          {selectedIds.size > 0 && (
            <button className="btn-bulk-delete" onClick={handleBulkDelete}>
              {selectedIds.size} 件を削除
            </button>
          )}
        </div>
      )}

      {!loading && (
        <table className="word-table">
          <thead>
            <tr>
              <th className="col-select">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  disabled={words.length === 0}
                />
              </th>
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
                  <td className="col-select">
                    <input type="checkbox" checked={selectedIds.has(w.id)} onChange={() => toggleSelect(w.id)} />
                  </td>
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
                  <td className="col-select">
                    <input type="checkbox" checked={selectedIds.has(w.id)} onChange={() => toggleSelect(w.id)} />
                  </td>
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
