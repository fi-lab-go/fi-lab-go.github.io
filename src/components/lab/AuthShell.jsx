import { Link } from "@tanstack/react-router";

const PATTERN = [
  ["sky", "", "teal", "", "amber"],
  ["", "amber", "", "sky", ""],
  ["teal", "", "sky", "", "teal"],
  ["", "sky", "", "amber", ""],
  ["amber", "", "teal", "", "sky"],
  ["", "teal", "", "teal", ""],
];

const TONES = {
  sky: "bg-sky-400/80",
  amber: "bg-amber-300/80",
  teal: "bg-teal-300/80",
};

export default function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.02fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-primary px-12 py-14 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 grid-lines opacity-20" aria-hidden="true" />
        <div className="absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-accent/40 blur-3xl" aria-hidden="true" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10 font-heading text-sm font-semibold">
              LA
            </span>
            <span className="font-heading text-sm font-semibold tracking-wide">Laboratorio de Automatización</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-heading text-4xl font-semibold leading-[1.1]">
            Tu hora en el laboratorio, reservada en segundos.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">
            Aparta hasta un horario por materia, con cupo controlado de PLC y MPS para que cada equipo tenga su
            espacio de práctica.
          </p>

          <div className="mt-9 grid w-full max-w-sm grid-cols-5 gap-1.5" aria-hidden="true">
            {PATTERN.flatMap((row, rowIndex) =>
              row.map((cell, cellIndex) => (
                <div
                  key={`${rowIndex}-${cellIndex}`}
                  className={`h-7 rounded-md ${cell ? TONES[cell] : "bg-primary-foreground/[0.07]"}`}
                />
              )),
            )}
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-primary-foreground/40">
            Lunes a viernes · 8:00 a 20:00
          </p>
        </div>

        <p className="relative text-[11px] text-primary-foreground/40">
          Acceso restringido a la red del laboratorio para estudiantes.
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <span className="font-heading text-sm font-semibold text-primary">Laboratorio de Automatización</span>
          </div>
          {eyebrow ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
          ) : null}
          <h2 className="mt-1.5 font-heading text-2xl font-semibold sm:text-[28px]">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
          <div className="mt-7">{children}</div>
          {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}