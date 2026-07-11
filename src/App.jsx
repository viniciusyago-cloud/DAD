import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import TroopsBoard from "./pages/TroopsBoard.jsx";
import TriAlliance from "./pages/TriAlliance.jsx";
import LogsPage from "./LogsPage.jsx";
import NavBar from "./components/NavBar.jsx";

/* ============================================================
   BigDaddys — app shell. Routes:
   /              Troops Intelligence Board (Supabase realtime)
   /tri-alliance  Ultimate Tri-Alliance Clash battle guide
   /dados         Change log (link-only, no nav entry)
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
        <Route path="/dados" element={<LogsPage />} />
        <Route path="*" element={<TroopsBoard />} />
      </Routes>
    </>
  );
}
