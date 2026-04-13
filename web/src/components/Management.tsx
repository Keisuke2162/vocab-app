import { useState } from "react";
import TagManager from "./TagManager";
import Settings from "./Settings";

type ManagementTab = "tags" | "settings";

export default function Management() {
  const [tab, setTab] = useState<ManagementTab>("tags");

  return (
    <div>
      <div className="sub-nav">
        <button
          className={tab === "tags" ? "active" : ""}
          onClick={() => setTab("tags")}
        >
          タグ管理
        </button>
        <button
          className={tab === "settings" ? "active" : ""}
          onClick={() => setTab("settings")}
        >
          設定
        </button>
      </div>

      {tab === "tags" && <TagManager />}
      {tab === "settings" && <Settings />}
    </div>
  );
}
