import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

// 先に必ず設定する
Amplify.configure(outputs);

// configure の後に App を読み込む（ここが肝）
import("./App.tsx").then(({ default: App }) => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
