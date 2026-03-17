"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function genererId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

export default function SimulationGazPage() {
  const router = useRouter();

  const [nomClient, setNomClient] = useState("");
  const [ville, setVille] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [dateFin, setDateFin] = useState("");

  const [consommation, setConsommation] = useState("");
  const [prixKwh, setPrixKwh] = useState("");
  const [abonnement, setAbonnement] = useState("");
  const [taxes, setTaxes] = useState("");

  const [facture, setFacture] = useState<File | null>(null);
  const [messageExtraction, setMessageExtraction] = useState("");

  const [prixUnifee, setPrixUnifee] = useState("0.11");
  const [abonnementUnifee, setAbonnementUnifee] = useState("100");

  const [coutActuel, setCoutActuel] = useState<number | null>(null);
  const [coutUnifee, setCoutUnifee] = useState<number | null>(null);
  const [economieAnnuelle, setEconomieAnnuelle] = useState<number | null>(null);
  const [economieMensuelle, setEconomieMensuelle] = useState<number | null>(null);
  const [pourcentage, setPourcentage] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("unifee-settings");
    if (saved) {
      const settings = JSON.parse(saved);
      setPrixUnifee(settings.gazPrix || "0.11");
      setAbonnementUnifee(settings.gazAbo || "100");
    }
  }, []);

  function extraireFacture() {
    if (!facture) {
      setMessageExtraction("Veuillez d’abord importer une facture.");
      return;
    }

    setMessageExtraction(
      `Facture prête à être analysée : ${facture.name}. La vraie extraction IA sera ajoutée à l’étape suivante.`
    );
  }

  function calculer() {
    const conso = parseFloat(consommation) || 0;
    const prix = parseFloat(prixKwh) || 0;
    const abo = parseFloat(abonnement) || 0;
    const taxesVal = parseFloat(taxes) || 0;

    const prixU = parseFloat(prixUnifee) || 0;
    const aboU = parseFloat(abonnementUnifee) || 0;

    const totalActuel = conso * prix + abo + taxesVal;
    const totalUnifee = conso * prixU + aboU + taxesVal;
    const economie = totalActuel - totalUnifee;
    const mensuel = economie / 12;
    const reduction = totalActuel > 0 ? (economie / totalActuel) * 100 : 0;

    setCoutActuel(totalActuel);
    setCoutUnifee(totalUnifee);
    setEconomieAnnuelle(economie);
    setEconomieMensuelle(mensuel);
    setPourcentage(reduction);
  }

  function enregistrerSimulation() {
    if (economieAnnuelle === null || coutActuel === null || coutUnifee === null) {
      return;
    }

    const historiqueActuel = JSON.parse(
      localStorage.getItem("unifee-simulations") || "[]"
    );

    const nouvelleSimulation = {
      id: genererId(),
      energie: "Gaz",
      nomClient,
      ville,
      fournisseur,
      dateFin,
      consommation,
      prixKwh,
      abonnement,
      taxes,
      prixUnifee,
      abonnementUnifee,
      coutActuel,
      coutUnifee,
      economieAnnuelle,
      economieMensuelle,
      pourcentage,
      dateCreation: new Date().toLocaleString("fr-FR"),
    };

    const nouvelHistorique = [nouvelleSimulation, ...historiqueActuel];
    localStorage.setItem("unifee-simulations", JSON.stringify(nouvelHistorique));
    router.push("/historique");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-center text-3xl font-bold text-slate-900">
          Simulation Gaz
        </h1>

        <div className="space-y-4 rounded-2xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Informations client
          </h2>

          <input
            type="text"
            placeholder="Nom du client"
            value={nomClient}
            onChange={(e) => setNomClient(e.target.value)}
            className="w-full rounded-xl border p-3"
          />

          <input
            type="text"
            placeholder="Ville"
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            className="w-full rounded-xl border p-3"
          />

          <input
            type="text"
            placeholder="Nom du fournisseur"
            value={fournisseur}
            onChange={(e) => setFournisseur(e.target.value)}
            className="w-full rounded-xl border p-3"
          />

          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="w-full rounded-xl border p-3"
          />

          <div className="rounded-xl border bg-slate-50 p-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Importer une facture
            </label>

            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFacture(e.target.files[0]);
                  setMessageExtraction("");
                }
              }}
              className="w-full"
            />

            {facture && (
              <p className="mt-2 text-sm text-green-600">
                Fichier sélectionné : {facture.name}
              </p>
            )}

            <button
              onClick={extraireFacture}
              className="mt-4 w-full rounded-xl bg-slate-900 p-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Extraire les informations
            </button>

            {messageExtraction && (
              <p className="mt-3 text-sm text-slate-600">{messageExtraction}</p>
            )}
          </div>

          <h2 className="pt-2 text-lg font-semibold text-slate-900">
            Offre actuelle
          </h2>

          <input
            type="number"
            placeholder="Consommation annuelle (kWh)"
            value={consommation}
            onChange={(e) => setConsommation(e.target.value)}
            className="w-full rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Prix actuel du kWh (€)"
            value={prixKwh}
            onChange={(e) => setPrixKwh(e.target.value)}
            className="w-full rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Abonnement annuel actuel (€)"
            value={abonnement}
            onChange={(e) => setAbonnement(e.target.value)}
            className="w-full rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Taxes annuelles (€)"
            value={taxes}
            onChange={(e) => setTaxes(e.target.value)}
            className="w-full rounded-xl border p-3"
          />

          <h2 className="pt-2 text-lg font-semibold text-slate-900">
            Offre UNIFEE
          </h2>

          <input
            type="number"
            value={prixUnifee}
            readOnly
            className="w-full rounded-xl border bg-slate-100 p-3 text-slate-700"
          />

          <input
            type="number"
            value={abonnementUnifee}
            readOnly
            className="w-full rounded-xl border bg-slate-100 p-3 text-slate-700"
          />

          <button
            onClick={calculer}
            className="w-full rounded-xl bg-slate-900 p-4 font-semibold text-white transition hover:bg-slate-800"
          >
            Calculer mes économies
          </button>
        </div>

        {economieAnnuelle !== null && (
          <div className="space-y-4 rounded-2xl border border-green-200 bg-green-50 p-6">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-wide text-slate-600">
                Économie annuelle
              </p>
              <p className="mt-2 text-4xl font-bold text-green-600">
                {economieAnnuelle.toFixed(0)} €
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white p-4 text-center">
                <p className="text-sm text-slate-500">Coût actuel</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {coutActuel?.toFixed(0)} €
                </p>
              </div>

              <div className="rounded-xl bg-white p-4 text-center">
                <p className="text-sm text-slate-500">Offre UNIFEE</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {coutUnifee?.toFixed(0)} €
                </p>
              </div>

              <div className="rounded-xl bg-white p-4 text-center">
                <p className="text-sm text-slate-500">Économie mensuelle</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {economieMensuelle?.toFixed(0)} €
                </p>
              </div>

              <div className="rounded-xl bg-white p-4 text-center">
                <p className="text-sm text-slate-500">Réduction</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {pourcentage?.toFixed(1)} %
                </p>
              </div>
            </div>

            <button
              onClick={enregistrerSimulation}
              className="w-full rounded-xl bg-green-600 p-4 font-semibold text-white transition hover:bg-green-700"
            >
              Enregistrer la simulation
            </button>
          </div>
        )}
      </div>
    </main>
  );
}