import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import TroopsBoard from "./pages/TroopsBoard.jsx";
import TriAlliance from "./pages/TriAlliance.jsx";
import LogsPage from "./LogsPage.jsx";
import NavBar from "./components/NavBar.jsx";
import EventPage from "./event/EventPage.jsx";
import EventEditor from "./event/EventEditor.jsx";
import "./event/event.css";

/* ============================================================
   BigDaddys — app shell. Routes:
   /               Troops Intelligence Board (Supabase realtime)
   /tri-alliance   Hand-built battle guide (stable)
   /evento         Editable event page (blocks + tabs)
   /evento/editar  Page builder (link-only)
   /dados          Change log (link-only, no nav entry)
   ============================================================ */

export default function App() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  const showNav = path === "/" || path === "/tri-alliance";
  return (
    <>
      {showNav && <NavBar />}
      <Routes>
        <Route path="/" element={<TroopsBoard />} />
        <Route path="/tri-alliance" element={<TriAlliance />} />
        <Route path="/evento" element={<EventPage />} />
        <Route path="/evento/editar" element={<EventEditor />} />
        <Route path="/dados" element={<LogsPage />} />
        <Route path="*" element={<TroopsBoard />} />
      </Routes>
    </>
  );
}
