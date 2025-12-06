"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { BarChart, Settings } from "lucide-react";


// Icons
import {
  LayoutDashboard,
  FileText,
  Users,
  Receipt,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function Sidebar({ collapsed, setCollapsed }: any) {
  const router = useRouter();
  const pathname = usePathname();

  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getSession();
      setLoggedIn(!!data.session);
    }
    check();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!loggedIn) return null;

  function isActive(path: string) {
    return pathname === path;
  }

  return (
    <aside
      className={`h-screen fixed left-0 top-0 flex flex-col p-4 shadow-sm border-r bg-white
        transition-all duration-300
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mb-6 text-gray-600 hover:text-blue-600 transition flex items-center"
      >
        {collapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
      </button>

      {/* Logo */}
      {!collapsed && (
        <h1 className={`text-2xl font-bold text-blue-600 mb-10`}>
          Invoice Maker
        </h1>
      )}

      <nav className="flex flex-col gap-3 text-gray-700">

        {/* Reusable Link Component */}
        {[
          { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
          { href: "/orders", label: "Orders", Icon: FileText },
          { href: "/customers", label: "Customers", Icon: Users },
          { href: "/invoices", label: "Invoices", Icon: Receipt },
          { href: "/reports", label: "Reports", Icon: BarChart },
          { href: "/settings", label: "Settings", Icon: Settings },
        ].map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`group flex items-center gap-3 px-3 py-2 rounded-md 
              transition-all duration-150 ease-in-out
              transform hover:scale-[1.03]
              ${collapsed ? "justify-center" : ""}
              ${
                isActive(href)
                  ? "bg-blue-100 text-blue-600 font-semibold"
                  : "hover:bg-gray-100 text-gray-700"
              }
            `}
          >
            <Icon
              size={collapsed ? 26 : 20}
              className="transition-transform duration-150 group-hover:scale-110"
            />

            {!collapsed && (
              <span className="transition-opacity duration-300">{label}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className={`mt-auto flex items-center gap-3 px-3 py-2 text-red-600 hover:text-red-700
          transition-all duration-150
          ${collapsed ? "justify-center" : ""}
        `}
      >
        <LogOut size={collapsed ? 26 : 20} />

        {!collapsed && (
          <span className="transition-opacity duration-300">Logout</span>
        )}
      </button>
    </aside>
  );
}
