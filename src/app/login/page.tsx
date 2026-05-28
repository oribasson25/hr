"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/jobs");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "שגיאה בכניסה");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-gray-light flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl border border-brand-gray-border shadow-sm w-full max-w-sm p-8">
        <div className="flex justify-center mb-8">
          <Image
            src="/libra-logo.png"
            alt="Libra"
            width={100}
            height={100}
            className="rounded-xl"
            priority
          />
        </div>

        <h1 className="text-2xl font-bold text-brand-black mb-1">כניסה למערכת</h1>
        <p className="text-brand-gray text-sm mb-6">הכניסי את פרטי הכניסה שלך</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">שם משתמש</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="שם משתמש"
              className="rounded-xl"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">סיסמה</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="סיסמה"
                className="rounded-xl pl-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray hover:text-brand-black transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
          )}

          <Button
            type="submit"
            disabled={!username || !password || loading}
            className="w-full rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold h-11 mt-2"
          >
            {loading ? "מתחבר..." : "כניסה"}
          </Button>
        </form>
      </div>
    </div>
  );
}
