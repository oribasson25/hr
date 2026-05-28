"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useJobs } from "@/lib/api/jobs";
import type { Candidate } from "@/types/api";

const schema = z.object({
  fullName: z.string().min(1, "נדרש שם מלא"),
  phone: z.string().min(9, "מספר טלפון לא תקין"),
  email: z.string().email("כתובת אימייל לא תקינה"),
  address: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData & { appliedForJobId?: string; appliedForCustom?: string; cv?: File }) => Promise<void>;
  defaultValues?: Partial<Candidate>;
  title?: string;
  loading?: boolean;
  isEdit?: boolean;
}

export default function CandidateForm({ open, onClose, onSubmit, defaultValues, title = "מועמד חדש", loading, isEdit }: Props) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [appliedForJobId, setAppliedForJobId] = useState<string>("");
  const [appliedForCustom, setAppliedForCustom] = useState<string>("");

  const { data: openJobs } = useJobs("open");

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: defaultValues?.fullName || "",
      phone: defaultValues?.phone || "",
      email: defaultValues?.email || "",
      address: defaultValues?.address || "",
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) setCvFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handleClose = () => {
    reset();
    setCvFile(null);
    setAppliedForJobId("");
    setAppliedForCustom("");
    onClose();
  };

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({
      ...data,
      cv: cvFile || undefined,
      appliedForJobId: appliedForJobId && appliedForJobId !== "custom" ? appliedForJobId : undefined,
      appliedForCustom: appliedForJobId === "custom" ? appliedForCustom : undefined,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">שם מלא *</Label>
            <Input id="fullName" {...register("fullName")} className="rounded-xl" />
            {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">טלפון *</Label>
              <Input id="phone" {...register("phone")} type="tel" className="rounded-xl" />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">אימייל *</Label>
              <Input id="email" {...register("email")} type="email" className="rounded-xl" />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">כתובת</Label>
            <Input id="address" {...register("address")} className="rounded-xl" />
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label>מתמודד למשרה</Label>
              <Select value={appliedForJobId} onValueChange={(v) => setAppliedForJobId(v ?? "")}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="בחרי משרה..." />
                </SelectTrigger>
                <SelectContent>
                  {openJobs?.map((j) => (
                    <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                  ))}
                  <SelectItem value="custom">אחר (רשמי ידנית)</SelectItem>
                </SelectContent>
              </Select>
              {appliedForJobId && appliedForJobId !== "custom" && (
                <Badge className="bg-green-50 text-green-700 border-green-200 rounded-full">
                  ✓ ישויך אוטומטית כמועמד
                </Badge>
              )}
              {appliedForJobId === "custom" && (
                <Input
                  value={appliedForCustom}
                  onChange={(e) => setAppliedForCustom(e.target.value)}
                  placeholder="שם המשרה / תיאור..."
                  className="rounded-xl mt-2"
                />
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>קורות חיים (PDF / DOCX, עד 10MB)</Label>
            {cvFile ? (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-brand-gray-border bg-brand-gray-light">
                <FileText className="w-5 h-5 text-brand-gray flex-shrink-0" />
                <span className="text-sm text-brand-black flex-1 truncate">{cvFile.name}</span>
                <button type="button" onClick={() => setCvFile(null)} className="text-brand-gray hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-brand-yellow bg-brand-yellow-soft" : "border-brand-gray-border hover:border-brand-gray"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-6 h-6 text-brand-gray mx-auto mb-2" />
                <p className="text-sm text-brand-gray">גרור קובץ לכאן או לחצי לבחירה</p>
              </div>
            )}
            {defaultValues?.cvFileName && !cvFile && (
              <p className="text-xs text-brand-gray">קובץ קיים: {defaultValues.cvFileName}</p>
            )}
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
