import React from "react";
import { NavLink } from "react-router-dom";

export default function NavBar() {
  const cls = ({ isActive }) => `nav-chip${isActive ? " on" : ""}`;
  return (
    <nav className="topnav">
      <NavLink to="/" end className={cls}>Troops Intel</NavLink>
      <NavLink to="/tri-alliance" className={cls}>Tri-Alliance</NavLink>
    </nav>
  );
}
