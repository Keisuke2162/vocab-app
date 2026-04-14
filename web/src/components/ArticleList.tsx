import { useEffect, useRef, useState } from "react";
import type { Article } from "../types";
import { fetchArticles, deleteArticle, patchArticle } from "../api";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  onSelect: (id: string) => void;
}

export default function ArticleList({ onSelect }: Props) {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    fetchArticles(token)
      .then(setArticles)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`「${article.title}」を削除しますか？\n関連する単語もすべて削除されます。`)) return;
    try {
      await deleteArticle(token, article.id);
      setArticles((prev) => prev.filter((a) => a.id !== article.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const startEdit = (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(article.id);
    setEditingTitle(article.title);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = async () => {
    if (!editingId) return;
    const trimmed = editingTitle.trim();
    const original = articles.find((a) => a.id === editingId)?.title ?? "";
    if (!trimmed || trimmed === original) {
      setEditingId(null);
      return;
    }
    try {
      await patchArticle(token, editingId, { title: trimmed });
      setArticles((prev) =>
        prev.map((a) => (a.id === editingId ? { ...a, title: trimmed } : a))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "タイトルの更新に失敗しました");
    } finally {
      setEditingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditingId(null);
  };

  if (loading) return <p className="status">読み込み中...</p>;
  if (error) return <p className="error">{error}</p>;

  if (articles.length === 0) {
    return <p className="status">登録した記事がまだありません</p>;
  }

  return (
    <ul className="article-list">
      {articles.map((a) => (
        <li
          key={a.id}
          className="article-list-item"
          onClick={() => editingId !== a.id && onSelect(a.id)}
        >
          <div className="article-list-info">
            {editingId === a.id ? (
              <input
                ref={inputRef}
                className="article-title-input"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="article-list-title">{a.title}</span>
            )}
            <span className="article-list-date">
              {new Date(a.created_at).toLocaleDateString("ja-JP")}
            </span>
          </div>
          <div className="article-list-actions">
            {editingId !== a.id && (
              <button
                className="btn-edit-sm"
                onClick={(e) => startEdit(a, e)}
              >
                編集
              </button>
            )}
            <button
              className="btn-delete-sm"
              onClick={(e) => handleDelete(a, e)}
            >
              削除
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
