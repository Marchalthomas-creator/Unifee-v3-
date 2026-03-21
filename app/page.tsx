"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eaf2ff_0%,_#f8fafc_45%,_#f8fafc_100%)] px-5 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-sm">
            UNIFEE
          </div>

          <h1 className="mt-5 text-5xl font-bold tracking-tight text-slate-900">
            Bienvenue
          </h1>

          <p className="mt-4 text-lg leading-8 text-slate-600">
  Simuler rapidement vos économies potentielles avec Unifee, expérience simple, rapide et claire.
</p>
        </div>

        <div className="rounded-[34px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
              Plateforme de simulation
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              Il n'est pas trop tard pour faire des économies ! 
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Accédez aux simulateurs pour réaliser une estimation client, ou ouvrez
              l’espace administrateur pour gérer les paramètres et l’historique.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <button
              type="button"
              onClick={() => router.push("/choix-simulateur")}
              className="w-full rounded-[24px] bg-slate-900 px-5 py-5 text-lg font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Accéder aux simulateurs
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="w-full rounded-[24px] border border-slate-300 bg-white px-5 py-5 text-lg font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Accès admin
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-blue-100 bg-blue-50/70 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            Ce que vous pouvez faire avec UNIFEE
          </h3>

          <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <p>• Simuler les économies en électricité</p>
            <p>• Simuler les économies en gaz</p>
            <p>• Comparer une offre combinée électricité + gaz</p>
            <p>• Préremplir les données via facture ou connexion compteur</p>
            <p>• Enregistrer et retrouver les simulations dans l’historique</p>
          </div>
        </div>
      </div>
    </main>
  );
}