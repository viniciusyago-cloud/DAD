import React from "react";
import { Routes, Route, useLocation, Navigate, useParams } from "react-router-dom";
import TroopsBoard from "./pages/TroopsBoard.jsx";
import TriAlliance from "./pages/TriAlliance.jsx";
import PagesIndex from "./pages/PagesIndex.jsx";
import LogsPage from "./LogsPage.jsx";
import NavBar from "./components/NavBar.jsx";
import SiteFooter from "./components/SiteFooter.jsx";
import EventPage from "./event/EventPage.jsx";
import EventEditor from "./event/EventEditor.jsx";
import "./event/event.css";
import "./event/imgedit/imgedit.css";

/* ============================================================
   BigDaddys — app shell.

   /                 Troops Intelligence Board
   /tri-alliance     Hand-built battle guide
   /paginas          Every page + create a new one
   /dados            Change log (link-only)
   /:slug            A page built in the editor
   /:slug/editar     …and its builder
   ============================================================ */

/* Old /e/:slug links keep working */
function LegacyEvent({ edit }) {
  const { slug } = useParams();
  return <Navigate to={`/${slug}${edit ? "/editar" : ""}`} replace />;
}

export default function App() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, "") || "/";
  const hideNav = path === "/dados" || path.endsWith("/editar");

  return (
    <>
      {!hideNav && <NavBar />}
      <Routes>
        <Route path="/" element={<TroopsBoard />} />
        <Route path="/tri-alliance" element={<TriAlliance />} />
        <Route path="/paginas" element={<PagesIndex />} />
        <Route path="/dados" element={<LogsPage />} />

        {/* legacy aliases */}
        <Route path="/evento" element={<Navigate to="/tri-alliance-clash" replace />} />
        <Route path="/e/:slug" element={<LegacyEvent />} />
        <Route path="/e/:slug/editar" element={<LegacyEvent edit />} />

        {/* editor-built pages */}
        <Route path="/:slug" element={<EventPage />} />
        <Route path="/:slug/editar" element={<EventEditor />} />
      </Routes>
      <SiteFooter />
    </>
  );
}
