import { Loader2 } from "lucide-react";

export default function FullLoader({ label = "Cargando" }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">{label}…</p>
    </div>
  );
}