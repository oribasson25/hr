"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; dueDate?: string | null }) => Promise<void>;
  loading?: boolean;
  defaultTitle?: string;
  contextLabel?: string;
};

export default function ReminderForm({ open, onClose, onSubmit, loading, defaultTitle = "", contextLabel }: Props) {
  const [title, setTitle] = useState(defaultTitle);
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setDueDate("");
    }
  }, [open, defaultTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onSubmit({ title: title.trim(), dueDate: dueDate || null });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>תזכורת חדשה</DialogTitle>
        </DialogHeader>
        {contextLabel && (
          <p className="text-sm text-brand-gray -mt-2">מקושרת ל: <span className="font-medium text-brand-black">{contextLabel}</span></p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reminder-title">כותרת</Label>
            <Input
              id="reminder-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למה צריך לזכור..."
              className="rounded-xl"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reminder-date">תאריך יעד (אופציונלי)</Label>
            <Input
              id="reminder-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">ביטול</Button>
            <Button
              type="submit"
              disabled={!title.trim() || loading}
              className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold"
            >
              {loading ? "שומר..." : "הוסף תזכורת"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
