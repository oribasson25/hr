"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Users, Mail, Phone, Briefcase, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import AppShell from "@/components/layout/AppShell";
import { useHrStaff, useCreateHrStaff, useUpdateHrStaff, useDeleteHrStaff } from "@/lib/api/hr-staff";
import type { HrStaff } from "@/types/api";

const schema = z.object({
  name: z.string().min(1, "נדרש שם"),
  email: z.string().email("אימייל לא תקין").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function HrStaffForm({ open, onClose, onSubmit, defaultValues, title, loading }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  defaultValues?: Partial<HrStaff>;
  title: string;
  loading?: boolean;
}) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name || "",
      email: defaultValues?.email || "",
      phone: defaultValues?.phone || "",
      role: defaultValues?.role || "",
    },
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(async (d) => { await onSubmit(d); handleClose(); })} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">שם *</Label>
            <Input id="name" {...register("name")} className="rounded-xl" />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">תפקיד</Label>
            <Input id="role" {...register("role")} placeholder="לדוגמה: מגייסת בכירה" className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">טלפון</Label>
              <Input id="phone" {...register("phone")} type="tel" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" {...register("email")} type="email" className="rounded-xl" />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
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

export default function HrStaffPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editStaff, setEditStaff] = useState<HrStaff | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<HrStaff | null>(null);

  const { data: staff, isLoading, isError } = useHrStaff();
  const createStaff = useCreateHrStaff();
  const deleteStaff = useDeleteHrStaff();

  const handleCreate = async (data: FormData) => {
    const result = await createStaff.mutateAsync(data);
    if (result.id) toast.success("עובד HR נוסף בהצלחה");
    else toast.error(typeof result.error === "string" ? result.error : "שגיאה");
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteStaff.mutateAsync(deleteConfirm.id);
    toast.success("עובד HR נמחק");
    setDeleteConfirm(null);
  };

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-black">עובדי משאבי אנוש</h1>
            <p className="text-brand-gray mt-1">{staff?.length ?? 0} אנשי HR במערכת</p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            עובד HR חדש
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-brand-gray-border p-6 animate-pulse h-40" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-20">
            <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-brand-black mb-2">שגיאה בטעינת עובדי HR</h2>
            <p className="text-brand-gray text-sm">יש לוודא שה-migration הורץ על מסד הנתונים</p>
          </div>
        ) : !Array.isArray(staff) || staff.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-brand-gray-border mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-brand-black mb-2">אין עובדי HR עדיין</h2>
            <p className="text-brand-gray mb-6">הוסיפי עובדי HR כדי לשייך אותם למועמדים</p>
            <Button onClick={() => setShowCreate(true)} className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold gap-2">
              <Plus className="w-4 h-4" />
              עובד HR חדש
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(staff ?? []).map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: i * 0.05, ease: "easeOut" }}
                className="bg-white rounded-2xl border border-brand-gray-border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-yellow-soft flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-black font-bold text-sm">
                        {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-black">{s.name}</h3>
                      {s.role && <p className="text-xs text-brand-gray">{s.role}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditStaff(s)}
                      className="p-1.5 text-brand-gray hover:text-brand-black hover:bg-brand-gray-light rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(s)}
                      className="p-1.5 text-brand-gray hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  {s.phone && (
                    <div className="flex items-center gap-2 text-brand-gray">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <a href={`tel:${s.phone}`} className="hover:text-brand-black hover:underline">{s.phone}</a>
                    </div>
                  )}
                  {s.email && (
                    <div className="flex items-center gap-2 text-brand-gray">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                      <a href={`mailto:${s.email}`} className="hover:text-brand-black hover:underline truncate">{s.email}</a>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-brand-gray-border flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-brand-gray" />
                  <span className="text-xs text-brand-gray">
                    {(s as typeof s & { _count?: { candidates: number } })._count?.candidates ?? 0} מועמדים משויכים
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <HrStaffForm
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        title="עובד HR חדש"
        loading={createStaff.isPending}
      />

      {editStaff && (
        <EditHrStaffDialog
          staff={editStaff}
          onClose={() => setEditStaff(null)}
        />
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>מחיקת עובד HR</DialogTitle>
          </DialogHeader>
          <p className="text-brand-gray text-sm">
            האם למחוק את "{deleteConfirm?.name}"? המועמדים המשויכים אליו לא יימחקו.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-xl">ביטול</Button>
            <Button onClick={handleDelete} disabled={deleteStaff.isPending} className="rounded-xl bg-red-500 text-white hover:bg-red-600">
              {deleteStaff.isPending ? "מוחק..." : "מחק"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function EditHrStaffDialog({ staff, onClose }: { staff: HrStaff; onClose: () => void }) {
  const updateStaff = useUpdateHrStaff(staff.id);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: staff.name, email: staff.email || "", phone: staff.phone || "", role: staff.role || "" },
  });

  const handleSubmitForm = async (data: FormData) => {
    const result = await updateStaff.mutateAsync(data);
    if (!result.error) { toast.success("עובד HR עודכן"); onClose(); }
    else toast.error("שגיאה בעדכון");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">עריכת עובד HR</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">שם *</Label>
            <Input id="edit-name" {...register("name")} className="rounded-xl" />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-role">תפקיד</Label>
            <Input id="edit-role" {...register("role")} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">טלפון</Label>
              <Input id="edit-phone" {...register("phone")} type="tel" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">אימייל</Label>
              <Input id="edit-email" {...register("email")} type="email" className="rounded-xl" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">ביטול</Button>
            <Button type="submit" disabled={updateStaff.isPending} className="rounded-xl bg-brand-yellow text-brand-black hover:bg-brand-yellow-hover font-semibold">
              {updateStaff.isPending ? "שומר..." : "שמירה"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
