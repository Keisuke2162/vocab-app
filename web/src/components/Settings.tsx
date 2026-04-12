import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("anthropic_api_key")
        .eq("id", user.id)
        .single();
      if (data?.anthropic_api_key) setApiKey(data.anthropic_api_key);
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError("");
    const { error } = await supabase
      .from("user_profiles")
      .upsert({ id: user.id, anthropic_api_key: apiKey });
    if (error) {
      setError(error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (loading) return <p className="status">読み込み中...</p>;

  return (
    <div className="settings">
      <div className="form-group">
        <label className="form-label">Anthropic API キー</label>
        <input
          className="form-input api-key-input"
          type="password"
          placeholder="sk-ant-api03-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <p className="settings-hint">
          記事登録時の単語抽出・解説生成に使用します。
          キーは <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer">Anthropic Console</a> から取得してください。
        </p>
      </div>

      {saved && <p className="success-msg">保存しました</p>}
      {error && <p className="error">{error}</p>}

      <button
        className="btn-add"
        onClick={handleSave}
        disabled={saving || !apiKey.trim()}
      >
        {saving ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
