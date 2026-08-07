import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import TroopsBoard from "./pages/TroopsBoard.jsx";
import TriAlliance from "./pages/TriAlliance.jsx";
import LogsPage from "./LogsPage.jsx";
import NavBar from "./components/NavBar.jsx";
import SiteFooter from "./components/SiteFooter.jsx";
import EventPage from "./event/EventPage.jsx";
import EventEditor from "./event/EventEditor.jsx";
import "./event/event.css";
import "./event/imgedit/imgedit.css";

/* ============================================================
   BigDaddys — app shell. Routes:
   /                 Troops Intelligence Board (Supabase realtime)
   /tri-alliance     Hand-built battle guide (stable)
   /e/:slug          Editable event page (blocks + tabs)
   /e/:slug/editar   Page builder (link-only)
   /dados            Change log (link-only, no nav entry)
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
        <Route path="/e/:slug" element={<EventPage />} />
        <Route path="/e/:slug/editar" element={<EventEditor />} />
        {/* legacy aliases */}
        <Route path="/evento" element={<Navigate to="/e/tri-alliance" replace />} />
        <Route path="/evento/editar" element={<Navigate to="/e/tri-alliance/editar" replace />} />
        <Route path="/dados" element={<LogsPage />} />
        <Route path="*" element={<TroopsBoard />} />
      </Routes>
      <SiteFooter />
    </>
  );
}
