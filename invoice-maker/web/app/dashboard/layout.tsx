"use client";

import Sidebar from "@/components/Sidebar";
import { useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* MAIN CONTENT */}
      <main
        className={`transition-all duration-300 p-10 w-full min-h-screen bg-gray-50
          ${collapsed ? "ml-20" : "ml-64"}
        `}
      >
        {children}
      </main>
    </div>
  );
}
