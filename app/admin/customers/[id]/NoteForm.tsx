"use client";

import { useState } from "react";

export default function AdminCustomerNoteForm({ customerId, initialNote }: { customerId: string; initialNote: string }) {
  const [note, setNote]     = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, adminNote: note }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Internal notes visible only to admins…"
        className="w-full bg-carbon border border-slate text-paper font-sans text-sm px-4 py-3 focus:outline-none focus:border-accent transition-colors resize-none placeholder-bone/30"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="font-mono text-xs text-obsidian bg-accent px-5 py-2 hover:bg-accent/80 transition-colors disabled:opacity-50"
      >
        {saved ? "Saved ✓" : saving ? "Saving…" : "Save Note"}
      </button>
    </div>
  );
}
