import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ListChecks, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: () => <AppShell><Home /></AppShell>,
});

type Stats = { today: number; month: number; total: number };

function Home() {
  const [stats, setStats] = useState<Stats>({ today: 0, month: 0, total: 0 });

  useEffect(() => { void load(); }, []);

  async function load() {
    const today = new Date(); today.setHours(0,0,0,0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const todayStr = today.toISOString().slice(0,10);
    const monthStr = monthStart.toISOString().slice(0,10);

    const { data, count } = await supabase
      .from("family_entries")
      .select("id, visit_date", { count: "exact" });

    const todayCount = (data || []).filter(d => d.visit_date >= todayStr).length;
    const monthCount = (data || []).filter(d => d.visit_date >= monthStr).length;
    setStats({ today: todayCount, month: monthCount, total: count || 0 });
  }

  async function exportAll() {
    const { data, error } = await supabase
      .from("family_entries")
      .select("*")
      .order("visit_date", { ascending: false });
    if (error) return toast.error(error.message);
    if (!data?.length) return toast.error("No entries to export");
    const rows = data.map(r => ({
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
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Family Data");
    XLSX.writeFile(wb, `family-data-${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Family Data</h2>
        <p className="text-sm text-muted-foreground">Quick overview of all collected data.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Today" value={stats.today} />
        <StatCard label="This Month" value={stats.month} />
        <StatCard label="Total" value={stats.total} />
      </div>

      <Button asChild className="h-14 w-full text-base">
        <Link to="/new"><PlusCircle className="mr-2 h-5 w-5" /> Add New Family</Link>
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline" className="h-12">
          <Link to="/entries"><ListChecks className="mr-2 h-4 w-4" /> View Entries</Link>
        </Button>
        <Button variant="outline" className="h-12" onClick={exportAll}>
          <Download className="mr-2 h-4 w-4" /> Export Excel
        </Button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className="text-2xl font-bold text-primary">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
