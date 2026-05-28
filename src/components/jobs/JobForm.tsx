"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Job } from "@/types/api";

const schema = z.object({
  title: z.string().min(1, "נדרשת כותרת"),
  description: z.string().min(1, "נדרש תיאור"),
  requirements: z.string().min(1, "נדרשות דרישות"),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  defaultValues?: Partial<Job>;
  title?: string;
  loading?: boolean;
}

export default function JobForm({ open, onClose, onSubmit, defaultValues, title = "משרה חדשה", loading }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      requirements: defaultValues?.requirements || "",
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(async (d) => { await onSubmit(d); handleClose(); })} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">כותרת המשרה</Label>
            <Input id="title" {...register("title")} placeholder="לדוגמה: מפתח Full Stack" className="rounded-xl" />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">תיאור</Label>
            <Textarea id="description" {...register("description")} rows={3} placeholder="תיאור המשרה..." className="rounded-xl resize-none" />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="requirements">דרישות</Label>
            <Textarea id="requirements" {...register("requirements")} rows={6} placeholder="כתבי כאן את דרישות התפקיד המדויקות..." className="rounded-xl resize-none" />
            {errors.requirements && <p className="text-sm text-red-500">{errors.requirements.message}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} className="rounded-xl">ביטול</Button>
            <Button type="submit" disabled={loading} className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold">
              {loading ? "שומר..." : "שמירה"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
