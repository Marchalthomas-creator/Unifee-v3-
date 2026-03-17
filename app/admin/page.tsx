"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [code, setCode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [message, setMessage] = useState("");

  const [electriciteBasePrix, setElectriciteBasePrix] = useState("0.18");
  const [electriciteBaseAbo, setElectriciteBaseAbo] = useState("120");

  const [electriciteHPPrix, setElectriciteHPPrix] = useState("0.20");
  const [electriciteHCPrix, setElectriciteHCPrix] = useState("0.16");
  const [electriciteHCAbo, setElectriciteHCAbo] = useState("130");

  const [gazPrix, setGazPrix] = useState("0.11");
  const [gazAbo, setGazAbo] = useState("100");

  useEffect(() => {
    const saved = localStorage.getItem("unifee-settings");

    if (saved) {
      const settings = JSON.parse(saved);

      setElectriciteBasePrix(settings.electriciteBasePrix || "0.18");
      setElectriciteBaseAbo(settings.electriciteBaseAbo || "120");
      setElectriciteHPPrix(settings.electriciteHPPrix || "0.20");
      setElectriciteHCPrix(settings.electriciteHCPrix || "0.16");
      setElectriciteHCAbo(settings.electriciteHCAbo || "130");
      setGazPrix(settings.gazPrix || "0.11");
      setGazAbo(settings.gazAbo || "100");
    }
  }, []);

  function verifierCode() {
    if (code === "UNIFEE2026") {
      setIsUnlocked(true);
      setMessage("");
    } else {
      setMessage("Code incorrect");
    }
  }

  function sauvegarder() {
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
  }

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-md space-y-6">
          <div>
            <Link
              href="/"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ← Retour à l’accueil
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-center text-3xl font-bold text-slate-900">
              Paramètres administrateur
            </h1>

            <p className="mt-4 text-center text-slate-600">
              Entrez votre clé d’accès pour modifier les offres UNIFEE
            </p>

            <div className="mt-6 space-y-4">
              <input
                type="password"
                placeholder="Clé d’accès"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border p-3"
              />

              <button
                onClick={verifierCode}
                className="w-full rounded-xl bg-slate-900 p-4 font-semibold text-white transition hover:bg-slate-800"
              >
                Accéder aux paramètres
              </button>

              {message && (
                <p className="text-center text-sm text-red-600">{message}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <Link
            href="/"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ← Retour à l’accueil
          </Link>
        </div>

        <h1 className="text-center text-3xl font-bold text-slate-900">
          Paramètres UNIFEE
        </h1>

        <div className="space-y-6 rounded-2xl border bg-white p-6">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Électricité — Option Base
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Prix UNIFEE du kWh (€)
              </label>
              <input
                type="number"
                value={electriciteBasePrix}
                onChange={(e) => setElectriciteBasePrix(e.target.value)}
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Abonnement UNIFEE annuel (€)
              </label>
              <input
                type="number"
                value={electriciteBaseAbo}
                onChange={(e) => setElectriciteBaseAbo(e.target.value)}
                className="w-full rounded-xl border p-3"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Électricité — Heures Pleines / Heures Creuses
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Prix UNIFEE heure pleine (€)
              </label>
              <input
                type="number"
                value={electriciteHPPrix}
                onChange={(e) => setElectriciteHPPrix(e.target.value)}
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Prix UNIFEE heure creuse (€)
              </label>
              <input
                type="number"
                value={electriciteHCPrix}
                onChange={(e) => setElectriciteHCPrix(e.target.value)}
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Abonnement UNIFEE annuel (€)
              </label>
              <input
                type="number"
                value={electriciteHCAbo}
                onChange={(e) => setElectriciteHCAbo(e.target.value)}
                className="w-full rounded-xl border p-3"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Gaz</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Prix UNIFEE du kWh (€)
              </label>
              <input
                type="number"
                value={gazPrix}
                onChange={(e) => setGazPrix(e.target.value)}
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Abonnement UNIFEE annuel (€)
              </label>
              <input
                type="number"
                value={gazAbo}
                onChange={(e) => setGazAbo(e.target.value)}
                className="w-full rounded-xl border p-3"
              />
            </div>
          </div>

          <button
            onClick={sauvegarder}
            className="w-full rounded-xl bg-slate-900 p-4 font-semibold text-white transition hover:bg-slate-800"
          >
            Enregistrer les paramètres
          </button>

          {message && (
            <p className="text-center text-sm text-green-600">{message}</p>
          )}
        </div>
      </div>
    </main>
  );
}