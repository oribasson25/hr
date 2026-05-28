"use client";

import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-60 min-h-screen bg-brand-gray-light">
        {children}
      </main>
    </div>
  );
}
