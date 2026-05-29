"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Users, FileText, Bell, Download, ChevronRight, ChevronLeft,
  Plus, Search, Kanban, Upload, RefreshCw, Trash2, AlertCircle, BookOpen,
  CheckCircle, Phone, ScanSearch,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  content: React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    title: "ברוכים הבאים",
    subtitle: "מערכת ניהול HR של ליברה",
    icon: <BookOpen className="w-10 h-10" />,
    color: "from-brand-yellow to-yellow-300",
    content: (
      <div className="space-y-6">
        <p className="text-lg text-brand-gray leading-relaxed">
          המערכת מאפשרת לכם לנהל מועמדים, משרות, קורות חיים ותזכורות במקום אחד, בצורה נוחה ויעילה.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: <Briefcase className="w-6 h-6 text-brand-yellow" />, label: "ניהול משרות" },
            { icon: <Users className="w-6 h-6 text-blue-500" />, label: "ניהול מועמדים" },
            { icon: <FileText className="w-6 h-6 text-red-500" />, label: "מאגר קורות חיים" },
            { icon: <Bell className="w-6 h-6 text-purple-500" />, label: "תזכורות חכמות" },
            { icon: <Download className="w-6 h-6 text-green-500" />, label: "ייצוא לאקסל" },
            { icon: <AlertCircle className="w-6 h-6 text-orange-500" />, label: "מניעת כפילויות" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-brand-gray-light rounded-xl px-4 py-3">
              {item.icon}
              <span className="font-medium text-brand-black text-sm">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-brand-gray">
          השתמשו בחצים למטה או במקלדת (←→) לניווט בין השקפים.
        </p>
      </div>
    ),
  },
  {
    id: 2,
    title: "ניהול משרות",
    subtitle: "יצירה, עדכון וניהול המשרות הפתוחות",
    icon: <Briefcase className="w-10 h-10" />,
    color: "from-yellow-400 to-amber-300",
    content: (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "פתוחה", color: "bg-green-100 text-green-700 border-green-200", desc: "משרה פעילה" },
            { label: "נסגרה", color: "bg-brand-black text-white border-brand-black", desc: "המשרה נסגרה" },
            { label: "סגורה", color: "bg-gray-100 text-gray-600 border-gray-200", desc: "לא פעילה" },
          ].map((s, i) => (
            <div key={i} className={`rounded-xl border-2 p-3 ${s.color}`}>
              <div className="font-bold mb-1">{s.label}</div>
              <div className="text-xs opacity-80">{s.desc}</div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <Step num={1} text='לחצו על "משרה חדשה" ומלאו כותרת, תיאור ודרישות' />
          <Step num={2} text="כל משרה פתוחה מקבלת לוח קנבן לניהול המועמדים המשויכים אליה" />
          <Step num={3} text='סמנו משרה כ"נסגרה" כשנסגרה — המועמדים עדיין נשמרים לעתיד' />
          <Step num={4} text="ניתן לערוך, למחוק ולראות את כל המשרות בעמוד המשרות" />
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "לוח קנבן",
    subtitle: "גרירה ושחרור לניהול תהליך המיון",
    icon: <Kanban className="w-10 h-10" />,
    color: "from-blue-400 to-sky-300",
    content: (
      <div className="space-y-5">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "מועמד", color: "bg-blue-100 border-blue-200 text-blue-800" },
            { label: "מוביל", color: "bg-brand-yellow border-yellow-300 text-brand-black" },
            { label: "לעתיד", color: "bg-purple-100 border-purple-200 text-purple-800" },
            { label: "לא רלוונטי", color: "bg-gray-100 border-gray-200 text-gray-600" },
          ].map((col, i) => (
            <div key={i} className={`border-2 rounded-xl p-2 text-center text-xs font-semibold ${col.color}`}>
              <div className="mb-2">{col.label}</div>
              <div className="h-10 bg-white/50 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <Step num={1} text='בתוך כל משרה תמצאו לוח עם 4 עמודות: מועמד, מוביל, לעתיד, לא רלוונטי' />
          <Step num={2} text="גררו כרטיסי מועמדים בין העמודות לעדכון הסטטוס" />
          <Step num={3} text="לחצו על כרטיס מועמד לצפייה מהירה בפרטיו וקורות החיים" />
          <Step num={4} text='לחצו "הוסף מועמד" להוספת מועמד קיים במערכת למשרה' />
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "ניהול מועמדים",
    subtitle: "הוספה, עריכה ומעקב אחר מועמדים",
    icon: <Users className="w-10 h-10" />,
    color: "from-green-400 to-emerald-300",
    content: (
      <div className="space-y-5">
        <div className="bg-brand-gray-light rounded-2xl p-4 space-y-2 text-sm">
          <div className="flex gap-2 items-center text-brand-gray">
            <span className="font-semibold text-brand-black w-24">שדות חובה:</span>
            שם מלא, טלפון, אימייל
          </div>
          <div className="flex gap-2 items-center text-brand-gray">
            <span className="font-semibold text-brand-black w-24">שדות רשות:</span>
            כתובת, משרה, קורות חיים
          </div>
          <div className="flex gap-2 items-center text-orange-600">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>מספר טלפון חייב להיות ייחודי — כפילות תחסם עם הודעת שגיאה</span>
          </div>
        </div>
        <div className="space-y-3">
          <Step num={1} text='בעמוד "מועמדים" לחצו "מועמד חדש" ומלאו את הפרטים' />
          <Step num={2} text="ניתן לצרף קורות חיים (PDF/DOCX עד 10MB) בעת ההקמה או לאחר מכן" />
          <Step num={3} text="בדף המועמד תוכלו להוסיף הערות, לשייך למשרות ולהגדיר תזכורות" />
          <Step num={4} text="חיפוש לפי שם, אימייל או טלפון בשורת החיפוש בראש העמוד" />
        </div>
      </div>
    ),
  },
  {
    id: 5,
    title: "ניהול קורות חיים",
    subtitle: "העלאה, החלפה ומחיקה",
    icon: <FileText className="w-10 h-10" />,
    color: "from-red-400 to-rose-300",
    content: (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Upload className="w-5 h-5 text-brand-gray" />, label: "העלאה", desc: "PDF או DOCX עד 10MB", color: "border-brand-gray-border" },
            { icon: <RefreshCw className="w-5 h-5 text-orange-500" />, label: "החלפה", desc: "מחליף את הקובץ הקיים", color: "border-orange-200" },
            { icon: <Trash2 className="w-5 h-5 text-red-500" />, label: "מחיקה", desc: "מסיר את הקובץ מהמועמד", color: "border-red-200" },
          ].map((a, i) => (
            <div key={i} className={`border-2 rounded-xl p-3 text-center ${a.color}`}>
              <div className="flex justify-center mb-2">{a.icon}</div>
              <div className="font-semibold text-sm text-brand-black">{a.label}</div>
              <div className="text-xs text-brand-gray mt-1">{a.desc}</div>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <Step num={1} text="היכנסו לדף המועמד — בצד שמאל תמצאו את אזור קורות החיים" />
          <Step num={2} text='כשאין קורות חיים — מופיע כפתור "העלאת קורות חיים"' />
          <Step num={3} text='כשיש קורות חיים — מופיעים 3 כפתורים: צפייה, החלפה, מחיקה' />
          <Step num={4} text="ניתן לצפות בקורות חיים ישירות בדפדפן ללא הורדה (PDF ו-DOCX)" />
        </div>
      </div>
    ),
  },
  {
    id: 6,
    title: "מאגר קורות חיים",
    subtitle: "מבט-על על כל קורות החיים במערכת",
    icon: <Search className="w-10 h-10" />,
    color: "from-purple-400 to-violet-300",
    content: (
      <div className="space-y-5">
        <div className="bg-brand-gray-light rounded-2xl p-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { label: "שם המועמד", color: "text-brand-black font-semibold" },
              { label: "מספר טלפון", color: "text-brand-gray" },
              { label: "סוג הקובץ (PDF/DOCX)", color: "text-brand-gray uppercase" },
              { label: "משרות משויכות + סטטוס", color: "text-blue-600" },
            ].map((f, i) => (
              <div key={i} className={`flex items-center gap-2 ${f.color}`}>
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                {f.label}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Step num={1} text='גשו ל"כל קורות החיים" בסרגל הניווט הצידי' />
          <Step num={2} text="סננו לפי משרה ספציפית או לפי האם המועמד משויך למשרה" />
          <Step num={3} text="חפשו לפי שם או אימייל בשורת החיפוש" />
          <Step num={4} text="לחיצה על כרטיסייה פותחת צפייה מלאה בקורות החיים" />
        </div>
      </div>
    ),
  },
  {
    id: 7,
    title: "תזכורות",
    subtitle: "אל תשכחו פגישות וקריאות חוזרות",
    icon: <Bell className="w-10 h-10" />,
    color: "from-orange-400 to-amber-300",
    content: (
      <div className="space-y-5">
        <div className="space-y-2">
          {[
            { label: "תזכורת למועמד", desc: "מהדף האישי של המועמד — כפתור 'הוסף תזכורת'", color: "bg-blue-50 border-blue-200" },
            { label: "תזכורת למשרה", desc: "מדף המשרה — ניהול תזכורות כלליות לתפקיד", color: "bg-yellow-50 border-yellow-200" },
            { label: "תזכורת כללית", desc: "מעמוד התזכורות — ללא קישור למועמד או משרה", color: "bg-gray-50 border-gray-200" },
          ].map((t, i) => (
            <div key={i} className={`border rounded-xl p-3 ${t.color}`}>
              <div className="font-semibold text-sm text-brand-black">{t.label}</div>
              <div className="text-xs text-brand-gray mt-0.5">{t.desc}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Step num={1} text="הגדירו תאריך יעד לכל תזכורת — הבאדג' הצהוב בסרגל מראה כמה פתוחות" />
          <Step num={2} text="סמנו תזכורות כ'הושלם' לאחר ביצוע — הן עוברות לארכיון" />
        </div>
      </div>
    ),
  },
  {
    id: 8,
    title: "ייצוא לאקסל",
    subtitle: "גיבוי וניתוח הנתונים שלכם",
    icon: <Download className="w-10 h-10" />,
    color: "from-green-400 to-teal-300",
    content: (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-2">
          {[
            { sheet: "מועמדים", fields: "שם, טלפון, אימייל, כתובת, קורות חיים, תאריך הקמה" },
            { sheet: "משרות", fields: "כותרת, תיאור, דרישות, סטטוס, תאריך" },
            { sheet: "שיוכים", fields: "מועמד, טלפון, משרה, סטטוס שיוך" },
            { sheet: "הערות", fields: "מועמד, טלפון, תוכן, תאריך" },
            { sheet: "תזכורות", fields: "כותרת, מועמד, משרה, תאריך יעד, סטטוס" },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3 bg-brand-gray-light rounded-xl px-4 py-2.5">
              <span className="font-bold text-sm text-brand-black w-20 flex-shrink-0">{s.sheet}</span>
              <span className="text-xs text-brand-gray">{s.fields}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
          <Download className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">
            לחצו על <strong>"ייצוא לאקסל"</strong> בתחתית הסרגל הצדדי — הקובץ יורד מיד עם כל הנתונים בעברית
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 9,
    title: "התאמת קורות חיים",
    subtitle: "מצאו את המועמד המתאים לכל משרה ללא AI",
    icon: <ScanSearch className="w-10 h-10" />,
    color: "from-cyan-500 to-teal-400",
    content: (
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "התאמה גבוהה", color: "bg-green-100 text-green-700 border-green-200", desc: "≥70%" },
            { label: "התאמה בינונית", color: "bg-yellow-100 text-yellow-700 border-yellow-200", desc: "40–69%" },
            { label: "התאמה נמוכה", color: "bg-red-100 text-red-700 border-red-200", desc: "<40%" },
          ].map((s, i) => (
            <div key={i} className={`rounded-xl border-2 p-3 ${s.color}`}>
              <div className="font-bold mb-1">{s.label}</div>
              <div className="text-xs opacity-80">{s.desc}</div>
            </div>
          ))}
        </div>
        <div className="bg-brand-gray-light rounded-2xl p-4 text-sm space-y-1">
          <p className="font-semibold text-brand-black mb-2">4 שיטות התאמה:</p>
          {[
            { label: "מדויק", desc: 'Python = "Python"', color: "text-green-700" },
            { label: "נרדף", desc: 'JS = "JavaScript"', color: "text-blue-700" },
            { label: "גזרה", desc: 'managed ≈ "manager"', color: "text-purple-700" },
            { label: "דומה", desc: 'managment ≈ "management"', color: "text-orange-700" },
          ].map((m, i) => (
            <div key={i} className={`flex items-center gap-2 ${m.color}`}>
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <strong>{m.label}</strong>: {m.desc}
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <Step num={1} text='גשו ל"התאמת קורות חיים" בסרגל הניווט הצידי' />
          <Step num={2} text="גררו קבצי PDF או DOCX לאזור הגרירה — ניתן מספר קבצים בו-זמנית" />
          <Step num={3} text='לחצו "התחל ניתוח" — המערכת תחלץ טקסט ותתאים מול כל המשרות' />
          <Step num={4} text="לכל קורות חיים תראו ציון לכל משרה ואילו מילות מפתח זוהו" />
        </div>
      </div>
    ),
  },
];

function Step({ num, text }: { num: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-brand-yellow text-brand-black text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {num}
      </span>
      <span className="text-sm text-brand-gray leading-relaxed">{text}</span>
    </div>
  );
}

export default function GuidePage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const total = SLIDES.length;

  const go = useCallback((dir: number) => {
    const next = current + dir;
    if (next < 0 || next >= total) return;
    setDirection(dir);
    setCurrent(next);
  }, [current, total]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(1);
      if (e.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go]);

  const slide = SLIDES[current];

  return (
    <AppShell>
      <div className="p-8 h-full flex flex-col">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-black">מדריך למשתמש</h1>
            <p className="text-brand-gray mt-1">הדרכה מלאה לשימוש במערכת</p>
          </div>
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  i === current ? "bg-brand-yellow w-6" : "bg-brand-gray-border hover:bg-brand-gray"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              initial={{ x: direction > 0 ? -60 : 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction > 0 ? 60 : -60, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <div className="bg-white rounded-3xl border border-brand-gray-border h-full flex flex-col overflow-hidden shadow-sm">
                <div className={`bg-gradient-to-l ${slide.color} p-8 flex items-center gap-5`}>
                  <div className="w-16 h-16 bg-white/30 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
                    {slide.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
                      שקף {current + 1} / {total}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{slide.title}</h2>
                    <p className="text-white/80 text-sm mt-0.5">{slide.subtitle}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                  {slide.content}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => go(-1)}
            disabled={current === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-brand-gray-border text-brand-gray hover:bg-brand-gray-light disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium text-sm"
          >
            <ChevronRight className="w-4 h-4" />
            הקודם
          </button>

          <span className="text-sm text-brand-gray">
            {current + 1} / {total}
          </span>

          <button
            onClick={() => go(1)}
            disabled={current === total - 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-semibold text-sm"
          >
            הבא
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
