"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Simulation = {
  id: string;
  energie: string;
  nomClient: string;
  ville: string;
  fournisseur: string;
  economieAnnuelle: number;
  economieMensuelle: number;
  pourcentage: number;
  dateCreation: string;
};

export default function HistoriquePage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("unifee-simulations");
    if (saved) {
      setSimulations(JSON.parse(saved));
    }
  }, []);

  function supprimerSimulation(id: string) {
    const nouvelHistorique = simulations.filter((simulation) => simulation.id !== id);
    setSimulations(nouvelHistorique);
    localStorage.setItem("unifee-simulations", JSON.stringify(nouvelHistorique));
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Historique</h1>

          <Link
            href="/choix-energie"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Nouvelle simulation
          </Link>
        </div>

        {simulations.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-center">
            <p className="text-slate-600">Aucune simulation enregistrée pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {simulations.map((simulation) => (
              <div
                key={simulation.id}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                      {simulation.energie}
                    </p>

                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {simulation.nomClient || "Client non renseigné"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-600">
                      {simulation.ville || "Ville non renseignée"}
                      {simulation.fournisseur ? ` • ${simulation.fournisseur}` : ""}
                    </p>
                  </div>

                  <button
                    onClick={() => supprimerSimulation(simulation.id)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Supprimer
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-sm text-slate-500">Économie annuelle</p>
                    <p className="mt-1 text-xl font-semibold text-green-600">
                      {simulation.economieAnnuelle.toFixed(0)} €
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-sm text-slate-500">Économie mensuelle</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {simulation.economieMensuelle.toFixed(0)} €
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 text-center col-span-2">
                    <p className="text-sm text-slate-500">Réduction</p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {simulation.pourcentage.toFixed(1)} %
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-slate-400">
                  Enregistrée le {simulation.dateCreation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}