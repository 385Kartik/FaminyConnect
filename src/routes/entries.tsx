import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Download, Search } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/entries")({
  component: () => <AppShell><Entries /></AppShell>,
});

type Entry = {
  id: string; karyakar_name: string | null; visit_date: string; family_number: number;
  child_name: string; father_name: string; mother_name: string; surname: string;
  standard: string | null; date_of_birth: string | null; school_name: string | null;
  home_address: string | null; father_mobile: string | null; mother_mobile: string | null;
  category: string; created_at: string;
};

function Entries() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Entry[]>([]);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("family_entries")
      .select("*")
      .order("visit_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data || []) as Entry[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (from && r.visit_date < from) return false;
      if (to && r.visit_date > to) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!`${r.child_name} ${r.father_name} ${r.surname} ${r.family_number} ${r.karyakar_name || ""}`.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [rows, search, from, to]);

  async function remove(id: string) {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from("family_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setRows(p => p.filter(r => r.id !== id));
  }

  function exportXlsx() {
    const data = filtered.map(r => ({
      "Family Number": r.family_number,
      "Visit Date": r.visit_date,
      "Karyakar": r.karyakar_name || "",
      "Child Name": r.child_name,
      "Father Name": r.father_name,
      "Mother Name": r.mother_name,
      "Surname": r.surname,
      "Standard": r.standard || "",
      "Date of Birth": r.date_of_birth || "",
      "School Name": r.school_name || "",
      "Home Address": r.home_address || "",
      "Father Mobile": r.father_mobile || "",
      "Mother Mobile": r.mother_mobile || "",
      "Category": r.category,
      "Submitted At": new Date(r.created_at).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Family Data");
const suffix = search ? `-${search.replace(/\s+/g, "_")}` : "";
XLSX.writeFile(wb, `family-data${suffix}-${new Date().toISOString().slice(0,10)}.xlsx`);  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Entries <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span></h2>
        <Button size="sm" onClick={exportXlsx} disabled={!filtered.length}>
  <Download className="mr-1 h-4 w-4" />
  {search || from || to ? `Export (${filtered.length} filtered)` : `Export All (${rows.length})`}
</Button>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, surname, family no, karyakar..." value={search} onChange={e => setSearch(e.target.value)} className="h-11 pl-9" />
        </div>
        
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No entries found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <Card key={r.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
<span className="text-xs font-mono text-muted-foreground">#{filtered.indexOf(r) + 1}</span>                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${r.category === "Satsangi" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{r.category}</span>
                    </div>
                    <div className="mt-1 truncate font-medium">{r.child_name} {r.surname}</div>
                    <div className="text-xs text-muted-foreground">
                      Father: {r.father_name} · {r.standard ? `Std ${r.standard} · ` : ""}{r.visit_date}
                    </div>
                    {r.karyakar_name && (
                      <div className="mt-0.5 text-xs text-muted-foreground">By: {r.karyakar_name}</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate({ to: "/entries/$id", params: { id: r.id } })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
