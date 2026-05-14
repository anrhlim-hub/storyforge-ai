import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <Settings className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-2 text-muted-foreground max-w-sm">
        Konfigurasi aplikasi, profil, dan integrasi layanan. Fitur ini akan hadir di Phase berikutnya.
      </p>
    </div>
  );
}
