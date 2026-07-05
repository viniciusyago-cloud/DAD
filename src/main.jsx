import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import LogsPage from "./LogsPage.jsx";
import "./index.css";

// Tiny path-based router (no dependency). /dados -> change log; else the board.
const path = window.location.pathname.replace(/\/+$/, "");
const Root = path === "/dados" ? LogsPage : App;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
