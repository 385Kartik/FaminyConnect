import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EntryForm, type EntryFormValues } from "@/components/EntryForm";
import { toast } from "sonner";

export const Route = createFileRoute("/entries/$id")({
  component: () => <AppShell><EditEntry /></AppShell>,
});

function EditEntry() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState<EntryFormValues | null>(null);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.from("family_entries").select("*").eq("id", id).maybeSingle();
      if (error || !data) { toast.error("Not found"); navigate({ to: "/entries" }); return; }
      setInitial({
        visit_date: data.visit_date,
        karyakar_name: data.karyakar_name || "",
        child_name: data.child_name,
        father_name: data.father_name,
        mother_name: data.mother_name,
        surname: data.surname,
        standard: data.standard || "",
        date_of_birth: data.date_of_birth || "",
        school_name: data.school_name || "",
        home_address: data.home_address || "",
        father_mobile: data.father_mobile || "",
        mother_mobile: data.mother_mobile || "",
        category: (data.category === "Non-Satsangi" ? "Non-Satsangi" : "Satsangi"),
      });
    })();
  }, [id, navigate]);

  if (!initial) return <p className="py-8 text-center text-muted-foreground">Loading...</p>;

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Edit Entry</h2>
      <EntryForm initial={initial} entryId={id} onSaved={() => navigate({ to: "/entries" })} />
    </div>
  );
}
