"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const [electriciteBasePrix, setElectriciteBasePrix] = useState("0.18");
  const [electriciteBaseAbo, setElectriciteBaseAbo] = useState("120");

  const [electriciteHPPrix, setElectriciteHPPrix] = useState("0.20");
  const [electriciteHCPrix, setElectriciteHCPrix] = useState("0.16");
  const [electriciteHCAbo, setElectriciteHCAbo] = useState("130");

  const [gazPrix, setGazPrix] = useState("0.11");
  const [gazAbo, setGazAbo] = useState("90");

  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("unifee-settings");
    if (!saved) return;

    try {
      const settings = JSON.parse(saved);

      setElectriciteBasePrix(settings.electriciteBasePrix || "0.18");
      setElectriciteBaseAbo(settings.electriciteBaseAbo || "120");

      setElectriciteHPPrix(settings.electriciteHPPrix || "0.20");
      setElectriciteHCPrix(settings.electriciteHCPrix || "0.16");
      setElectriciteHCAbo(settings.electriciteHCAbo || "130");

      setGazPrix(settings.gazPrix || "0.11");
      setGazAbo(settings.gazAbo || "90");
    } catch {
      // no-op
    }
  }, []);

  function sauvegarderParametres() {
    const settings = {
      electriciteBasePrix,
      electriciteBaseAbo,
      electriciteHPPrix,
      electriciteHCPrix,
      electriciteHCAbo,
      gazPrix,
      gazAbo,
    };

    localStorage.setItem("unifee-settings", JSON.stringify(settings));
    setMessage("Paramètres enregistrés avec succès.");

    setTimeout(() => {
      setMessage("");
    }, 2500);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff_0%,_#f8fafc_45%,_#f8fafc_100%)] px-5 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
          >
            ← Accueil
          </button>

          <div className="text-right">
            <div className="inline-block rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm">
              UNIFEE
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Accès administrateur
            </p>
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Paramètres UNIFEE
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Gérez ici les prix, abonnements et l’accès à l’historique.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => router.push("/historique")}
              className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Voir l’historique
            </button>

            <button
              type="button"
              onClick={() => router.push("/simulation-electricite")}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Ouvrir la simulation électricité
            </button>

            <button
              type="button"
              onClick={() => router.push("/simulation-gaz")}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Ouvrir la simulation gaz
            </button>

            <button
              type="button"
              onClick={() => router.push("/simulation-complete")}
              className="w-full rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-4 text-base font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Simu complète électricité + gaz
            </button>
          </div>
        </div>

        <section className="space-y-4 rounded-[30px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-bold text-slate-900">
            Paramètres électricité
          </h2>

          <div className="rounded-[24px] bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Offre standard
            </h3>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Prix UNIFEE du kWh (€)
                </label>
                <input
                  type="number"
                  value={electriciteBasePrix}
                  onChange={(e) => setElectriciteBasePrix(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="0.18"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Abonnement UNIFEE annuel (€)
                </label>
                <input
                  type="number"
                  value={electriciteBaseAbo}
                  onChange={(e) => setElectriciteBaseAbo(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="120"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[24px] bg-slate-50 p-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Offre heures pleines / heures creuses
            </h3>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Prix UNIFEE heure pleine (€)
                </label>
                <input
                  type="number"
                  value={electriciteHPPrix}
                  onChange={(e) => setElectriciteHPPrix(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="0.20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Prix UNIFEE heure creuse (€)
                </label>
                <input
                  type="number"
                  value={electriciteHCPrix}
                  onChange={(e) => setElectriciteHCPrix(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="0.16"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Abonnement UNIFEE annuel (€)
                </label>
                <input
                  type="number"
                  value={electriciteHCAbo}
                  onChange={(e) => setElectriciteHCAbo(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="130"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-[30px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <h2 className="text-2xl font-bold text-slate-900">Paramètres gaz</h2>

          <div className="rounded-[24px] bg-slate-50 p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Prix UNIFEE du kWh (€)
                </label>
                <input
                  type="number"
                  value={gazPrix}
                  onChange={(e) => setGazPrix(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="0.11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Abonnement UNIFEE annuel (€)
                </label>
                <input
                  type="number"
                  value={gazAbo}
                  onChange={(e) => setGazAbo(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  placeholder="90"
                />
              </div>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={sauvegarderParametres}
          className="w-full rounded-[22px] bg-blue-600 px-4 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Enregistrer les paramètres
        </button>

        {message && (
          <div className="rounded-2xl bg-green-50 px-4 py-4 text-center text-sm font-semibold text-green-700">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}