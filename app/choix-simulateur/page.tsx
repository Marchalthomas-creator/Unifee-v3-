"use client";

import { useRouter } from "next/navigation";

export default function ChoixSimulateurPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff_0%,_#f8fafc_45%,_#f8fafc_100%)] px-5 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-left text-lg font-semibold text-slate-900"
        >
          ← Retour
        </button>

        <div className="rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Choix du simulateur
            </h1>
            <p className="mt-4 text-xl text-slate-700">
              Sélectionnez le type d’énergie à comparer
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={() => router.push("/simulation-electricite")}
              className="w-full rounded-[24px] bg-slate-900 px-6 py-5 text-xl font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              Simuler mes économies d’électricité
            </button>

            <button
              type="button"
              onClick={() => router.push("/simulation-gaz")}
              className="w-full rounded-[24px] border border-slate-300 bg-white px-6 py-5 text-xl font-bold text-slate-900 transition hover:bg-slate-50"
            >
              Simuler mes économies de gaz
            </button>

            <button
              type="button"
              onClick={() => router.push("/simulation-complete")}
              className="w-full rounded-[24px] bg-emerald-600 px-6 py-5 text-xl font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Simuler mes économies d’électricité + gaz
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}