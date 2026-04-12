import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchUserTags,
  extractWords,
  saveArticle,
  saveWord,
} from "../api";
import type { Tag, ExtractedWord } from "../types";

export default function ArticleRegister() {
  const { session } = useAuth();
  const token = session?.access_token ?? "";

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [extracted, setExtracted] = useState<ExtractedWord[] | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchUserTags(token)
      .then(setTags)
      .catch(() => {});
  }, [token]);

  const toggleTag = (name: string) => {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const handleExtract = async () => {
    if (!text.trim()) return;
    setExtracting(true);
    setError("");
    setExtracted(null);
    try {
      const words = await extractWords(token, text);
      setExtracted(words);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "抽出に失敗しました");
    } finally {
      setExtracting(false);
    }
  };

  const toggleQuiz = (index: number) => {
    setExtracted((prev) =>
      prev!.map((w, i) =>
        i === index ? { ...w, quiz_enabled: !w.quiz_enabled } : w
      )
    );
  };

  const handleSave = async () => {
    if (!title.trim() || !extracted) return;
    setSaving(true);
    setError("");
    try {
      const article = await saveArticle(token, {
        title,
        input_type: "text",
        original_text: text,
      });
      await Promise.all(
        extracted.map((w) =>
          saveWord(token, {
            en: w.en,
            ja: w.ja,
            tags: selectedTags,
            article_id: article.id,
            quiz_enabled: w.quiz_enabled,
          })
        )
      );
      setSuccessMsg(`「${title}」を保存しました（${extracted.length}語）`);
      setTimeout(() => setSuccessMsg(""), 4000);
      setTitle("");
      setText("");
      setSelectedTags([]);
      setExtracted(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="article-register">
      <h2 className="section-title">記事登録</h2>

      {successMsg && <p className="success-msg">{successMsg}</p>}
      {error && <p className="error">{error}</p>}

      <div className="form-group">
        <label className="form-label">タイトル</label>
        <input
          className="form-input"
          type="text"
          placeholder="例: BBC News 2024-04-12"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">記事テキスト</label>
        <textarea
          className="form-textarea"
          placeholder="英語記事のテキストを貼り付けてください"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
        />
      </div>

      {tags.length > 0 && (
        <div className="form-group">
          <label className="form-label">タグ</label>
          <div className="tag-chips">
            {tags.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`tag-chip ${selectedTags.includes(t.name) ? "selected" : ""}`}
                onClick={() => toggleTag(t.name)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        className="extract-btn"
        onClick={handleExtract}
        disabled={extracting || !text.trim()}
      >
        {extracting ? "抽出中..." : "単語を抽出する"}
      </button>

      {extracted && (
        <div className="extract-result">
          <div className="extract-result-header">
            <span className="extract-count">{extracted.length}語 抽出されました</span>
            <span className="extract-hint">クイズに出題しない単語のチェックを外してください</span>
          </div>
          <table className="word-register-table">
            <thead>
              <tr>
                <th>クイズ</th>
                <th>英語</th>
                <th>日本語</th>
              </tr>
            </thead>
            <tbody>
              {extracted.map((w, i) => (
                <tr key={i} className={w.quiz_enabled ? "" : "quiz-disabled"}>
                  <td className="quiz-check">
                    <input
                      type="checkbox"
                      checked={w.quiz_enabled}
                      onChange={() => toggleQuiz(i)}
                    />
                  </td>
                  <td>{w.en}</td>
                  <td>{w.ja}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={saving || !title.trim()}
          >
            {saving ? "保存中..." : "保存する"}
          </button>
          {!title.trim() && (
            <p className="save-hint">保存するにはタイトルを入力してください</p>
          )}
        </div>
      )}
    </div>
  );
}
