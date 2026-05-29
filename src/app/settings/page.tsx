"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, Eye, EyeOff, Save, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings?key=ANTHROPIC_API_KEY")
      .then((r) => r.json())
      .then((data) => {
        setSavedKey(data.value);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "ANTHROPIC_API_KEY", value: apiKey.trim() }),
      });
      setSavedKey(apiKey.trim());
      setApiKey("");
      toast.success("המפתח נשמר בהצלחה");
    } catch {
      toast.error("שגיאה בשמירת המפתח");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "ANTHROPIC_API_KEY", value: "" }),
      });
      setSavedKey(null);
      toast.success("המפתח הוסר");
    } catch {
      toast.error("שגיאה בהסרת המפתח");
    } finally {
      setSaving(false);
    }
  };

  const maskedKey = savedKey
    ? savedKey.slice(0, 7) + "•".repeat(20) + savedKey.slice(-4)
    : null;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-7 h-7 text-brand-yellow" />
        <h1 className="text-2xl font-bold text-brand-black">הגדרות מערכת</h1>
      </div>

      <div className="bg-white rounded-2xl border border-brand-gray-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-black mb-1">מפתח Anthropic API</h2>
        <p className="text-sm text-brand-gray mb-5">
          נדרש לניתוח AI של קורות חיים בעמוד ההתאמה. המפתח נשמר בצורה מאובטחת בבסיס הנתונים.
        </p>

        {loading ? (
          <div className="h-10 bg-brand-gray-light rounded-xl animate-pulse" />
        ) : savedKey ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-mono text-green-800 flex-1 truncate">{maskedKey}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                הסר מפתח
              </button>
              <button
                onClick={() => setSavedKey(null)}
                className="px-4 py-2 text-sm rounded-xl border border-brand-gray-border text-brand-gray hover:bg-brand-gray-light transition-colors"
              >
                החלף מפתח
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                dir="ltr"
                className="w-full border border-brand-gray-border rounded-xl px-4 py-3 pr-12 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-yellow"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray hover:text-brand-black transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim() || saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-yellow text-brand-black text-sm font-semibold rounded-xl hover:bg-brand-yellow/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? "שומר..." : "שמור מפתח"}
            </button>
          </div>
        )}

        <p className="mt-5 text-xs text-brand-gray">
          ניתן לקבל מפתח API בכתובת{" "}
          <span className="font-mono text-brand-black">console.anthropic.com</span>
        </p>
      </div>
    </div>
  );
}
