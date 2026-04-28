import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EntryForm, blankEntry } from "@/components/EntryForm";

export const Route = createFileRoute("/new")({
  component: () => <AppShell><NewEntry /></AppShell>,
});

function NewEntry() {
  const navigate = useNavigate();
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Add New Family</h2>
      <EntryForm initial={blankEntry()} onSaved={() => navigate({ to: "/entries" })} />
    </div>
  );
}
