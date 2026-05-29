"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Phone, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AppShell from "@/components/layout/AppShell";
import { toast } from "sonner";

export interface Caller {
  id: string;
  name: string;
  extension: string;
}

const STORAGE_KEY = "hr_callers";

export function loadCallers(): Caller[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCallers(callers: Caller[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(callers));
}

export default function SettingsPage() {
  const [callers, setCallers] = useState<Caller[]>([]);
  const [newName, setNewName] = useState("");
  const [newExt, setNewExt] = useState("");

  useEffect(() => {
    setCallers(loadCallers());
  }, []);

  const handleAdd = () => {
    if (!newName.trim() || !newExt.trim()) return;
    const caller: Caller = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      extension: newExt.trim(),
    };
    const updated = [...callers, caller];
    setCallers(updated);
    saveCallers(updated);
    setNewName("");
    setNewExt("");
    toast.success("המתקשר נוסף");
  };

  const handleDelete = (id: string) => {
    const updated = callers.filter((c) => c.id !== id);
    setCallers(updated);
    saveCallers(updated);
    toast.success("המתקשר נמחק");
  };

  return (
    <AppShell>
      <div className="p-8 max-w-xl">
        <div className="mb-8 flex items-center gap-3">
          <Settings className="w-7 h-7 text-brand-black" />
          <div>
            <h1 className="text-3xl font-bold text-brand-black">הגדרות</h1>
            <p className="text-brand-gray mt-1">ניהול רשימת מתקשרים למרכזיה</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-gray-border p-6">
          <h2 className="font-semibold text-brand-black mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            מתקשרים
          </h2>

          <div className="space-y-2 mb-6">
            {callers.length === 0 && (
              <p className="text-sm text-brand-gray py-6 text-center">אין מתקשרים עדיין</p>
            )}
            {callers.map((caller) => (
              <div
                key={caller.id}
                className="flex items-center justify-between bg-brand-gray-light rounded-xl px-4 py-3"
              >
                <div>
                  <span className="font-medium text-brand-black text-sm">{caller.name}</span>
                  <span className="text-brand-gray text-xs mr-3">שלוחה: {caller.extension}</span>
                </div>
                <button
                  onClick={() => handleDelete(caller.id)}
                  className="text-brand-gray hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs text-brand-gray mb-1 block">שם</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="שם המתקשר"
                className="rounded-xl"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="w-32">
              <Label className="text-xs text-brand-gray mb-1 block">שלוחה</Label>
              <Input
                value={newExt}
                onChange={(e) => setNewExt(e.target.value)}
                placeholder="1234"
                className="rounded-xl"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={!newName.trim() || !newExt.trim()}
              className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold gap-2"
            >
              <Plus className="w-4 h-4" />
              הוסף
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
