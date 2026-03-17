"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function genererId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

export default function SimulationElectricitePage() {
  const router = useRouter();

  const [nomClient, setNomClient] = useState("");
  const [ville, setVille] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [dateFin, setDateFin] = useState("");

  const [typeContrat, setTypeContrat] = useState("base");

  const [consommation, setConsommation] = useState("");
  const [prixKwh, setPrixKwh] = useState("");

  const [prixHP, setPrixHP] = useState("");
  const [consoHP, setConsoHP] = useState("");

  const [prixHC, setPrixHC] = useState("");
  const [consoHC, setConsoHC] = useState("");

  const [abonnement, setAbonnement] = useState("");
  const [turpe, setTurpe] = useState("");
  const [taxes, setTaxes] = useState("");

  const [facture, setFacture] = useState<File | null>(null);
  const [messageExtraction, setMessageExtraction] = useState("");

  const [prixUnifee, setPrixUnifee] = useState("0.18");
  const [aboUnifee, setAboUnifee] = useState("120");
  const [prixUnifeeHP, setPrixUnifeeHP] = useState("0.20");
  const [prixUnifeeHC, setPrixUnifeeHC] = useState("0.16");
  const [aboUnifeeHcHp, setAboUnifeeHcHp] = useState("130");

  const [coutActuel, setCoutActuel] = useState<number | null>(null);
  const [coutUnifee, setCoutUnifee] = useState<number | null>(null);
  const [economieAnnuelle, setEconomieAnnuelle] = useState<number | null>(null);
  const [economieMensuelle, setEconomieMensuelle] = useState<number | null>(null);
  const [pourcentage, setPourcentage] = useState<number | null>(null);
  const [prixMoyenActuel, setPrixMoyenActuel] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("unifee-settings");
    if (saved) {
      const settings = JSON.parse(saved);
      setPrixUnifee(settings.electriciteBasePrix || "0.18");
      setAboUnifee(settings.electriciteBaseAbo || "120");
      setPrixUnifeeHP(settings.electriciteHPPrix || "0.20");
      setPrixUnifeeHC(settings.electriciteHCPrix || "0.16");
      setAboUnifeeHcHp(settings.electriciteHCAbo || "130");
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
    const abo = parseFloat(abonnement) || 0;
    const turpeVal = parseFloat(turpe) || 0;
    const taxesVal = parseFloat(taxes) || 0;

    let totalActuel = 0;
    let totalUnifee = 0;
    let economie = 0;
    let mensuel = 0;
    let reduction = 0;

    if (typeContrat === "base") {
      const conso = parseFloat(consommation) || 0;
      const prix = parseFloat(prixKwh) || 0;

      const prixU = parseFloat(prixUnifee) || 0;
      const aboU = parseFloat(aboUnifee) || 0;

      totalActuel = conso * prix + abo + turpeVal + taxesVal;
      totalUnifee = conso * prixU + aboU + turpeVal + taxesVal;
      setPrixMoyenActuel(prix);
    } else {
      const hp = parseFloat(consoHP) || 0;
      const hc = parseFloat(consoHC) || 0;
      const prixHpVal = parseFloat(prixHP) || 0;
      const prixHcVal = parseFloat(prixHC) || 0;

      const prixHpU = parseFloat(prixUnifeeHP) || 0;
      const prixHcU = parseFloat(prixUnifeeHC) || 0;
      const aboU = parseFloat(aboUnifeeHcHp) || 0;

      const totalConso = hp + hc;
      const totalEnergieActuelle = hp * prixHpVal + hc * prixHcVal;
      const totalEnergieUnifee = hp * prixHpU + hc * prixHcU;

      const prixMoyen = totalEnergieActuelle / (totalConso || 1);
      setPrixMoyenActuel(prixMoyen);

      totalActuel = totalEnergieActuelle + abo + turpeVal + taxesVal;
      totalUnifee = totalEnergieUnifee + aboU + turpeVal + taxesVal;
    }

    economie = totalActuel - totalUnifee;
    mensuel = economie / 12;
    reduction = totalActuel > 0 ? (economie / totalActuel) * 100 : 0;

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
      energie: "Électricité",
      typeContrat,
      nomClient,
      ville,
      fournisseur,
      dateFin,
      consommation,
      prixKwh,
      prixHP,
      consoHP,
      prixHC,
      consoHC,
      abonnement,
      turpe,
      taxes,
      prixUnifee,
      aboUnifee,
      prixUnifeeHP,
      prixUnifeeHC,
      aboUnifeeHcHp,
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
          Simulation Électricité
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

          <select
            value={typeContrat}
            onChange={(e) => setTypeContrat(e.target.value)}
            className="w-full rounded-xl border p-3"
          >
            <option value="base">Option Base</option>
            <option value="hc-hp">Heures Pleines / Heures Creuses</option>
          </select>

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

          {typeContrat === "base" && (
            <>
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
                value={aboUnifee}
                readOnly
                className="w-full rounded-xl border bg-slate-100 p-3 text-slate-700"
              />
            </>
          )}

          {typeContrat === "hc-hp" && (
            <>
              <h2 className="pt-2 text-lg font-semibold text-slate-900">
                Offre actuelle
              </h2>

              <input
                type="number"
                placeholder="Prix kWh heure pleine (€)"
                value={prixHP}
                onChange={(e) => setPrixHP(e.target.value)}
                className="w-full rounded-xl border p-3"
              />

              <input
                type="number"
                placeholder="Consommation heure pleine (kWh)"
                value={consoHP}
                onChange={(e) => setConsoHP(e.target.value)}
                className="w-full rounded-xl border p-3"
              />

              <input
                type="number"
                placeholder="Prix kWh heure creuse (€)"
                value={prixHC}
                onChange={(e) => setPrixHC(e.target.value)}
                className="w-full rounded-xl border p-3"
              />

              <input
                type="number"
                placeholder="Consommation heure creuse (kWh)"
                value={consoHC}
                onChange={(e) => setConsoHC(e.target.value)}
                className="w-full rounded-xl border p-3"
              />

              {prixMoyenActuel !== null && (
                <div className="rounded-xl bg-slate-100 p-4">
                  <p className="text-sm text-slate-500">Prix moyen actuel</p>
                  <p className="font-semibold text-slate-900">
                    {prixMoyenActuel.toFixed(4)} €/kWh
                  </p>
                </div>
              )}

              <h2 className="pt-2 text-lg font-semibold text-slate-900">
                Offre UNIFEE
              </h2>

              <input
                type="number"
                value={prixUnifeeHP}
                readOnly
                className="w-full rounded-xl border bg-slate-100 p-3 text-slate-700"
              />

              <input
                type="number"
                value={prixUnifeeHC}
                readOnly
                className="w-full rounded-xl border bg-slate-100 p-3 text-slate-700"
              />

              <input
                type="number"
                value={aboUnifeeHcHp}
                readOnly
                className="w-full rounded-xl border bg-slate-100 p-3 text-slate-700"
              />
            </>
          )}

          <input
            type="number"
            placeholder="Abonnement annuel (€)"
            value={abonnement}
            onChange={(e) => setAbonnement(e.target.value)}
            className="w-full rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="TURPE annuel (€)"
            value={turpe}
            onChange={(e) => setTurpe(e.target.value)}
            className="w-full rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="Taxes annuelles (€)"
            value={taxes}
            onChange={(e) => setTaxes(e.target.value)}
            className="w-full rounded-xl border p-3"
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