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

  const [prixUnifee, setPrixUnifee] = useState("0.09");
  const [aboUnifee, setAboUnifee] = useState("150");

  const [coutActuel, setCoutActuel] = useState<number | null>(null);
  const [coutUnifee, setCoutUnifee] = useState<number | null>(null);
  const [economieAnnuelle, setEconomieAnnuelle] = useState<number | null>(null);
  const [economieMensuelle, setEconomieMensuelle] = useState<number | null>(null);
  const [pourcentage, setPourcentage] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("unifee-settings");
    if (saved) {
      const settings = JSON.parse(saved);
      setPrixUnifee(settings.gazPrix || "0.09");
      setAboUnifee(settings.gazAbo || "150");
    }
  }, []);

  function extraireFacture() {
    if (!facture) {
      setMessageExtraction("Veuillez d’abord importer une facture.");
      return;
    }

    setMessageExtraction(
      `Facture prête à être analysée : ${facture.name}`
    );
  }

  function calculer() {
    const conso = parseFloat(consommation) || 0;
    const prix = parseFloat(prixKwh) || 0;
    const abo = parseFloat(abonnement) || 0;
    const taxesVal = parseFloat(taxes) || 0;

    const prixU = parseFloat(prixUnifee) || 0;
    const aboU = parseFloat(aboUnifee) || 0;

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
    if (economieAnnuelle === null) return;

    const historique = JSON.parse(
      localStorage.getItem("unifee-simulations") || "[]"
    );

    const nouvelle = {
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
      aboUnifee,
      coutActuel,
      coutUnifee,
      economieAnnuelle,
      economieMensuelle,
      pourcentage,
      dateCreation: new Date().toLocaleString("fr-FR"),
    };

    localStorage.setItem(
      "unifee-simulations",
      JSON.stringify([nouvelle, ...historique])
    );

    router.push("/historique");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-md space-y-6">

        <h1 className="text-center text-3xl font-bold text-slate-900">
          Simulation Gaz
        </h1>

        <div className="space-y-5 rounded-2xl border bg-white p-6">

          {/* CLIENT */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Informations client</h2>

            <input
              placeholder="Nom du client"
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
              className="w-full rounded-xl border p-3"
            />

            <input
              placeholder="Ville"
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="w-full rounded-xl border p-3"
            />

            <input
              placeholder="Fournisseur actuel"
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
          </div>

          {/* FACTURE */}
          <div className="rounded-xl border bg-slate-50 p-4">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                if (e.target.files?.[0]) setFacture(e.target.files[0]);
              }}
              className="w-full"
            />

            <button
              onClick={extraireFacture}
              className="mt-3 w-full rounded-xl bg-slate-900 p-3 text-white"
            >
              Extraire les informations
            </button>

            {messageExtraction && (
              <p className="mt-2 text-sm">{messageExtraction}</p>
            )}
          </div>

          {/* OFFRE ACTUELLE */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Offre actuelle</h2>

            <div>
              <label className="text-sm">Consommation annuelle (kWh)</label>
              <input
                type="number"
                value={consommation}
                onChange={(e) => setConsommation(e.target.value)}
                className="w-full rounded-xl border p-3"
              />
            </div>

            <div>
              <label className="text-sm">Prix actuel du kWh (€)</label>
              <input
                type="number"
                value={prixKwh}
                onChange={(e) => setPrixKwh(e.target.value)}
                className="w-full rounded-xl border p-3"
              />
            </div>
          </div>

          {/* OFFRE UNIFEE */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Offre UNIFEE</h2>

            <div className="rounded-xl bg-slate-100 p-4">
              <p className="text-sm text-slate-500">Prix UNIFEE du kWh</p>
              <p className="text-lg font-semibold">{prixUnifee} €</p>
            </div>

            <div className="rounded-xl bg-slate-100 p-4">
              <p className="text-sm text-slate-500">
                Abonnement UNIFEE annuel
              </p>
              <p className="text-lg font-semibold">{aboUnifee} €</p>
            </div>
          </div>

          {/* COUTS */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Coûts actuels</h2>

            <input
              type="number"
              placeholder="Abonnement annuel (€)"
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
          </div>

          <button
            onClick={calculer}
            className="w-full rounded-xl bg-slate-900 p-4 text-white"
          >
            Calculer mes économies
          </button>
        </div>

        {/* RESULTATS */}
        {economieAnnuelle !== null && (
          <div className="rounded-2xl bg-green-50 p-6 space-y-4">

            <div className="text-center">
              <p className="text-sm">Économie annuelle</p>
              <p className="text-4xl font-bold text-green-600">
                {economieAnnuelle.toFixed(0)} €
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-xl text-center">
                <p className="text-sm">Actuel</p>
                <p>{coutActuel?.toFixed(0)} €</p>
              </div>

              <div className="bg-white p-4 rounded-xl text-center">
                <p className="text-sm">UNIFEE</p>
                <p>{coutUnifee?.toFixed(0)} €</p>
              </div>

              <div className="bg-white p-4 rounded-xl text-center">
                <p className="text-sm">Mensuel</p>
                <p>{economieMensuelle?.toFixed(0)} €</p>
              </div>

              <div className="bg-white p-4 rounded-xl text-center">
                <p className="text-sm">Réduction</p>
                <p>{pourcentage?.toFixed(1)} %</p>
              </div>
            </div>

            <button
              onClick={enregistrerSimulation}
              className="w-full rounded-xl bg-green-600 p-4 text-white"
            >
              Enregistrer la simulation
            </button>
          </div>
        )}
      </div>
    </main>
  );
}