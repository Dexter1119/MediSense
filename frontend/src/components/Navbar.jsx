////////////////////////////////////////////////////////////////////
//
// File Name : Navbar.jsx
// Description : Common navigation bar for all portals
// Author      : Pradhumnya Changdev Kalsait
// Date        : 17/01/26
//
////////////////////////////////////////////////////////////////////

import { useContext, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { LogOut, LayoutDashboard, ShieldCheck, Menu, X } from "lucide-react";

/**
 * ////////////////////////////////////////////////////////////////
 *
 * Function Name : Navbar
 * Description   : Displays application-wide navigation bar
 * Author        : Pradhumnya Changdev Kalsait
 * Date          : 17/01/26
 *
 * ////////////////////////////////////////////////////////////////
 */
function Navbar() {
  const { userRole, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/");
  }

  function isActive(path) {
    return location.pathname === path;
  }

  const navLinks = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={16} />,
      show: true,
    },
    {
      to: "/admin",
      label: "Admin Panel",
      icon: <ShieldCheck size={16} />,
      show: userRole === "ADMIN",
    },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">

          {/* ================= LEFT — Logo + Nav ================= */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-teal-400 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-textprimary tracking-tight leading-tight">
                  Medi<span className="text-primary">Sense</span>
                </span>
                <span className="text-[9px] font-bold tracking-[0.15em] uppercase leading-none">
                  <span className="text-indigo-500">Predict</span>
                  <span className="text-slate-300 mx-0.5">›</span>
                  <span className="text-teal-500">Prevent</span>
                  <span className="text-slate-300 mx-0.5">›</span>
                  <span className="text-emerald-500">Cure</span>
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks
                .filter((link) => link.show)
                .map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive(link.to)
                        ? "bg-primary-light text-primary"
                        : "text-textsecondary hover:text-textprimary hover:bg-slate-100"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
            </div>
          </div>

          {/* ================= RIGHT — Role + Logout ================= */}
          <div className="flex items-center gap-3">
            {/* Role Badge */}
            {userRole && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className={`w-2 h-2 rounded-full ${
                  userRole === "ADMIN" ? "bg-amber-400" : "bg-emerald-400"
                } animate-pulse`} />
                <span className="text-xs font-semibold text-textsecondary uppercase tracking-wider">
                  {userRole}
                </span>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-sm shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/25 hover:from-indigo-700 hover:to-indigo-600 active:scale-[0.97] transition-all duration-200"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-textsecondary hover:bg-slate-100 transition"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ================= MOBILE MENU ================= */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200/60 bg-white/90 backdrop-blur-xl animate-slide-up">
          <div className="px-4 py-3 space-y-1">
            {navLinks
              .filter((link) => link.show)
              .map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition ${
                    isActive(link.to)
                      ? "bg-primary-light text-primary"
                      : "text-textsecondary hover:bg-slate-50"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}

            {userRole && (
              <div className="flex items-center gap-2 px-4 py-3 text-xs font-semibold text-textsecondary uppercase tracking-wider">
                <div className={`w-2 h-2 rounded-full ${
                  userRole === "ADMIN" ? "bg-amber-400" : "bg-emerald-400"
                }`} />
                {userRole}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
