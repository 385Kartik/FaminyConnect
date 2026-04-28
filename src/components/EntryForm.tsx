import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const KARYAKAR_KEY = "family_data_karyakar_name";

export type EntryFormValues = {
  visit_date: string;
  karyakar_name: string;
  child_name: string;
  father_name: string;
  mother_name: string;
  surname: string;
  standard: string;
  date_of_birth: string;
  school_name: string;
  home_address: string;
  father_mobile: string;
  mother_mobile: string;
  category: "Satsangi" | "Non-Satsangi";
};

export const blankEntry = (): EntryFormValues => ({
  visit_date: new Date().toISOString().slice(0, 10),
  karyakar_name: typeof window !== "undefined" ? (localStorage.getItem(KARYAKAR_KEY) || "") : "",
  child_name: "", father_name: "", mother_name: "", surname: "",
  standard: "", date_of_birth: "", school_name: "", home_address: "",
  father_mobile: "", mother_mobile: "", category: "Satsangi",
});

export function EntryForm({
  initial, entryId, onSaved,
}: { initial: EntryFormValues; entryId?: string; onSaved: () => void }) {
  const [v, setV] = useState<EntryFormValues>(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!entryId && !v.karyakar_name && typeof window !== "undefined") {
      const stored = localStorage.getItem(KARYAKAR_KEY);
      if (stored) setV(p => ({ ...p, karyakar_name: stored }));
    }
  }, [entryId]);

  const set = <K extends keyof EntryFormValues>(k: K, val: EntryFormValues[K]) => setV(p => ({ ...p, [k]: val }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (typeof window !== "undefined" && v.karyakar_name) {
      localStorage.setItem(KARYAKAR_KEY, v.karyakar_name);
    }
    const payload = {
      visit_date: v.visit_date,
      karyakar_name: v.karyakar_name || null,
      child_name: v.child_name,
      father_name: v.father_name,
      mother_name: v.mother_name,
      surname: v.surname,
      category: v.category,
      date_of_birth: v.date_of_birth || null,
      standard: v.standard || null,
      school_name: v.school_name || null,
      home_address: v.home_address || null,
      father_mobile: v.father_mobile || null,
      mother_mobile: v.mother_mobile || null,
    };
    const { error } = entryId
      ? await supabase.from("family_entries").update(payload).eq("id", entryId)
      : await supabase.from("family_entries").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(entryId ? "Entry updated" : "Family added");
    onSaved();
  };

  return (
    <form onSubmit={submit} className="space-y-4 pb-20">
      <Field label="Karyakar Name" required>
        <Input required value={v.karyakar_name} onChange={e => set("karyakar_name", e.target.value)} placeholder="Your name" className="h-12" />
      </Field>
      <Field label="Date of Visit" required>
        <Input type="date" required value={v.visit_date} onChange={e => set("visit_date", e.target.value)} className="h-12" />
      </Field>
      <Field label="Child Name" required>
        <Input required value={v.child_name} onChange={e => set("child_name", e.target.value)} className="h-12" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Father Name" required>
          <Input required value={v.father_name} onChange={e => set("father_name", e.target.value)} className="h-12" />
        </Field>
        <Field label="Mother Name" required>
          <Input required value={v.mother_name} onChange={e => set("mother_name", e.target.value)} className="h-12" />
        </Field>
      </div>
      <Field label="Surname" required>
        <Input required value={v.surname} onChange={e => set("surname", e.target.value)} className="h-12" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Standard">
          <Input value={v.standard} onChange={e => set("standard", e.target.value)} placeholder="e.g. 5" className="h-12" />
        </Field>
        <Field label="Date of Birth">
          <Input type="date" value={v.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} className="h-12" />
        </Field>
      </div>
      <Field label="School Name">
        <Input value={v.school_name} onChange={e => set("school_name", e.target.value)} className="h-12" />
      </Field>
      <Field label="Home Address">
        <Textarea value={v.home_address} onChange={e => set("home_address", e.target.value)} rows={2} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Father Mobile">
          <Input type="tel" inputMode="tel" maxLength={15} value={v.father_mobile} onChange={e => set("father_mobile", e.target.value)} className="h-12" />
        </Field>
        <Field label="Mother Mobile">
          <Input type="tel" inputMode="tel" maxLength={15} value={v.mother_mobile} onChange={e => set("mother_mobile", e.target.value)} className="h-12" />
        </Field>
      </div>
      <Field label="Category" required>
        <Select value={v.category} onValueChange={(x) => set("category", x as "Satsangi" | "Non-Satsangi")}>
          <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Satsangi">Satsangi</SelectItem>
            <SelectItem value="Non-Satsangi">Non-Satsangi</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t bg-card px-4 py-3">
        <div className="mx-auto max-w-5xl">
          <Button type="submit" disabled={busy} className="h-12 w-full text-base">
            {busy ? "Saving..." : entryId ? "Update Entry" : "Save Entry"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="ml-0.5 text-destructive">*</span>}</Label>
      {children}
    </div>
  );
}
