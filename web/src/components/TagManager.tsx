import { useEffect, useState } from "react";
import type { Tag } from "../types";
import { fetchUserTags, createTag, deleteTag } from "../api";
import { useAuth } from "../contexts/AuthContext";

export default function TagManager() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const [tags, setTags] = useState<Tag[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchUserTags(token).then(setTags).catch(() => {});
  }, [token]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setLoading(true);
    setError("");
    try {
      const tag = await createTag(token, name);
      setTags((prev) => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (!window.confirm(`「${tag.name}」を削除しますか？`)) return;
    try {
      await deleteTag(token, tag.id);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    }
  };

  return (
    <div className="tag-manager">
      <div className="tag-create-row">
        <input
          className="form-input tag-input"
          type="text"
          placeholder="新しいタグ名"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button className="btn-add" onClick={handleCreate} disabled={loading || !newName.trim()}>
          追加
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {tags.length === 0 ? (
        <p className="status">タグがまだありません</p>
      ) : (
        <ul className="tag-list">
          {tags.map((t) => (
            <li key={t.id} className="tag-list-item">
              <span className="tag-list-name">{t.name}</span>
              <button className="btn-delete-sm" onClick={() => handleDelete(t)}>削除</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
