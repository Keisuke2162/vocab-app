import { supabase } from "../lib/supabase";

export default function Login() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Vocab App</h1>
        <p className="login-desc">英単語学習アプリ</p>
        <button className="google-btn" onClick={handleGoogleLogin}>
          Googleでログイン
        </button>
      </div>
    </div>
  );
}
