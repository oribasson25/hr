"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Briefcase, Users, FileText, Bell, LogOut, Download, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePendingRemindersCount } from "@/lib/api/reminders";
import { toast } from "sonner";

const staticNavItems = [
  { href: "/jobs", label: "משרות", icon: Briefcase },
  { href: "/candidates", label: "מועמדים", icon: Users },
  { href: "/cvs", label: "כל קורות החיים", icon: FileText },
  { href: "/guide", label: "מדריך למשתמש", icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: pendingCount } = usePendingRemindersCount();

  const handleExport = async () => {
    try {
      toast.loading("מייצא נתונים...", { id: "export" });
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("שגיאה בייצוא");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toLocaleDateString("he-IL").replace(/\//g, "-");
      a.href = url;
      a.download = `hr-export-${date}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("הקובץ הורד בהצלחה", { id: "export" });
    } catch {
      toast.error("שגיאה בייצוא הנתונים", { id: "export" });
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="fixed top-0 right-0 h-full w-60 bg-white border-l border-brand-gray-border z-40 flex flex-col">
      <div className="p-5 border-b border-brand-gray-border flex items-center justify-center">
        <Image
          src="/libra-logo.png"
          alt="Libra"
          width={120}
          height={120}
          className="rounded-xl"
          priority
        />
      </div>

      <nav className="flex-1 py-4 px-3">
        {staticNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-colors duration-150",
                isActive
                  ? "bg-brand-yellow-soft text-brand-black font-semibold border-r-4 border-brand-yellow"
                  : "text-brand-gray hover:bg-brand-gray-light hover:text-brand-black"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}

        {(() => {
          const isActive = pathname === "/reminders";
          return (
            <Link
              href="/reminders"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-colors duration-150",
                isActive
                  ? "bg-brand-yellow-soft text-brand-black font-semibold border-r-4 border-brand-yellow"
                  : "text-brand-gray hover:bg-brand-gray-light hover:text-brand-black"
              )}
            >
              <Bell className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">תזכורות</span>
              {(pendingCount ?? 0) > 0 && (
                <span className="bg-brand-yellow text-brand-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {pendingCount! > 99 ? "99+" : pendingCount}
                </span>
              )}
            </Link>
          );
        })()}
      </nav>

      <div className="p-3 border-t border-brand-gray-border space-y-1">
        <button
          onClick={handleExport}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-brand-gray hover:bg-green-50 hover:text-green-700 transition-colors duration-150 text-sm"
        >
          <Download className="w-4 h-4 flex-shrink-0" />
          <span>ייצוא לאקסל</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-brand-gray hover:bg-red-50 hover:text-red-600 transition-colors duration-150 text-sm"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>יציאה</span>
        </button>
      </div>
    </aside>
  );
}
