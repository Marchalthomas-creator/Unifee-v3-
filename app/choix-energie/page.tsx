import Link from "next/link";

export default function ChoixEnergiePage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Retour
          </Link>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            Choix du simulateur
          </h1>

          <p className="mt-3 text-center text-slate-600">
            Sélectionnez le type d’énergie à comparer
          </p>

          <div className="mt-8 space-y-4">
            <Link
              href="/simulation-electricite"
              className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-5 text-center text-lg font-semibold text-white transition hover:bg-slate-800"
            >
              Simuler mes économies d’électricité
            </Link>

            <Link
              href="/simulation-gaz"
              className="flex w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-5 text-center text-lg font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Simuler mes économies de gaz
            </Link>

            <Link
              href="/historique"
              className="flex w-full items-center justify-center rounded-2xl bg-green-600 px-6 py-5 text-center text-lg font-semibold text-white transition hover:bg-green-700"
            >
              Voir l’historique des simulations
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}