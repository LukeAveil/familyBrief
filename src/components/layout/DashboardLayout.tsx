 "use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { logout } from "@/services/authClient";

const NAV = [
  { label: "Calendar", href: "/dashboard", icon: "◈" },
  { label: "Family", href: "/dashboard/family", icon: "◉" },
  { label: "Briefings", href: "/dashboard/briefings", icon: "◎" },
  { label: "Settings", href: "/dashboard/settings", icon: "◌" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.push("/auth");
    }
  };

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <div className="sidebar-logo">FB</div>
        <div className="sidebar-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="sidebar-footer">
          <button
            type="button"
            className="nav-item logout"
            onClick={handleLogout}
          >
            <span className="nav-icon">⊘</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}

