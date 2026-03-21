"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff_0%,_#f8fafc_45%,_#f8fafc_100%)] px-5 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-block rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 shadow-sm">
            UNIFEE
          </div>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">
            Accueil
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Choisissez l’action à réaliser.
          </p>
        </div>

        <div className="rounded-[30px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => router.push("/choix-simulateur")}
              className="w-full rounded-[22px] bg-slate-900 px-4 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Accéder aux simulateurs
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="w-full rounded-[22px] border border-slate-300 bg-white px-4 py-4 text-lg font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Accès admin
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}