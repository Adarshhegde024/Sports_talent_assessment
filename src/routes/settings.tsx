import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Switch } from "@/components/ui/switch";
import { DISCLAIMER } from "@/data/mock";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SportSense AI" },
      {
        name: "description",
        content: "Manage capture preferences, notifications and data handling options.",
      },
      { property: "og:title", content: "Settings — SportSense AI" },
      {
        property: "og:description",
        content: "Capture, notification and privacy preferences for SportSense AI.",
      },
    ],
  }),
  component: SettingsPage,
});

const options = [
  { id: "notifications", label: "Assessment reminders", hint: "Nudge me to re-test every 3 weeks." },
  { id: "local-only", label: "Keep video on device", hint: "Clips never leave this device." },
  { id: "metric", label: "Metric units", hint: "Show centimetres and kilograms." },
] as const;

function SettingsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    notifications: true,
    "local-only": true,
    metric: true,
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="label-meta text-muted-foreground">Preferences</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>

        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
          {options.map((option) => (
            <div key={option.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.hint}</p>
              </div>
              <Switch
                checked={enabled[option.id] ?? false}
                onCheckedChange={(checked) =>
                  setEnabled((current) => ({ ...current, [option.id]: checked }))
                }
                aria-label={option.label}
              />
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">{DISCLAIMER}</p>
      </div>
    </AppShell>
  );
}
