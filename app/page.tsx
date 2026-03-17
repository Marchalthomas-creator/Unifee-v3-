import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex justify-end">
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              Paramètres
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Bienvenue chez Unifee
            </h1>

            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Commencez à calculer les économies d’énergie
            </p>

            <Link
              href="/choix-energie"
              className="mt-10 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-slate-800"
            >
              Accéder à l’outil
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}