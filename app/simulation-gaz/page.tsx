"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";

function genererId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

export default function SimulationGazPage() {
  const router = useRouter();

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  function gererSelectionFacture(file: File | null) {
    if (!file) return;
    setFacture(file);
    setMessageExtraction("");
  }

  function extraireFacture() {
    if (!facture) {
      setMessageExtraction("Veuillez d’abord charger une photo ou une facture.");
      return;
    }

    setMessageExtraction(
      `Facture chargée : ${facture.name}. Le bouton est prêt pour la future extraction automatique OCR/IA.`
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

  function genererPDF() {
    if (
      economieAnnuelle === null ||
      coutActuel === null ||
      coutUnifee === null
    ) {
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("UNIFEE - Simulation Gaz", 20, 20);

    doc.setFontSize(11);
    doc.text(`Client : ${nomClient || "-"}`, 20, 35);
    doc.text(`Ville : ${ville || "-"}`, 20, 43);
    doc.text(`Fournisseur : ${fournisseur || "-"}`, 20, 51);

    doc.setFontSize(14);
    doc.text("Résultat de la simulation", 20, 68);

    doc.setFontSize(12);
    doc.text(`Coût actuel annuel : ${coutActuel.toFixed(0)} €`, 20, 81);
    doc.text(`Coût annuel avec UNIFEE : ${coutUnifee.toFixed(0)} €`, 20, 89);
    doc.text(`Économie annuelle : ${economieAnnuelle.toFixed(0)} €`, 20, 101);
    doc.text(`Économie mensuelle : ${economieMensuelle?.toFixed(0)} €`, 20, 109);
    doc.text(`Réduction estimée : ${pourcentage?.toFixed(1)} %`, 20, 117);

    doc.setTextColor(0, 128, 0);
    doc.text(
      `En passant chez UNIFEE, vous économisez environ ${economieAnnuelle.toFixed(0)} € par an.`,
      20,
      133
    );

    doc.setTextColor(0, 0, 0);
    doc.save(`simulation-gaz-${nomClient || "client"}.pdf`);
  }

  function enregistrerSimulation() {
    if (
      economieAnnuelle === null ||
      coutActuel === null ||
      coutUnifee === null
    ) {
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
      aboUnifee,
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

        <div className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Informations client
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nom du client</label>
              <input
                type="text"
                value={nomClient}
                onChange={(e) => setNomClient(e.target.value)}
                className="w-full rounded-xl border p-3"
                placeholder="Nom du client"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Ville</label>
              <input
                type="text"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="w-full rounded-xl border p-3"
                placeholder="Ville"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Fournisseur actuel</label>
              <input
                type="text"
                value={fournisseur}
                onChange={(e) => setFournisseur(e.target.value)}
                className="w-full rounded-xl border p-3"
                placeholder="Nom du fournisseur"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Date de fin d’engagement
              </label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full rounded-xl border p-3"
              />
            </div>
          </div>

          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="mb-3 text-sm font-medium text-slate-700">
              Charger une facture
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="rounded-xl bg-slate-900 p-3 font-semibold text-white transition hover:bg-slate-800"
              >
                Prendre une photo
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-slate-300 bg-white p-3 font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Importer une facture
              </button>
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => gererSelectionFacture(e.target.files?.[0] || null)}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => gererSelectionFacture(e.target.files?.[0] || null)}
            />

            {facture && (
              <p className="mt-3 text-sm text-green-600">
                Fichier sélectionné : {facture.name}
              </p>
            )}

            <button
              type="button"
              onClick={extraireFacture}
              className="mt-4 w-full rounded-xl bg-blue-600 p-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Extraire les informations
            </button>

            {messageExtraction && (
              <p className="mt-3 text-sm text-slate-600">{messageExtraction}</p>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Offre actuelle</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Consommation annuelle (kWh)
              </label>
              <input
                type="number"
                value={consommation}
                onChange={(e) => setConsommation(e.target.value)}
                className="w-full rounded-xl border p-3"
                placeholder="Consommation annuelle"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Prix actuel du kWh (€)
              </label>
              <input
                type="number"
                value={prixKwh}
                onChange={(e) => setPrixKwh(e.target.value)}
                className="w-full rounded-xl border p-3"
                placeholder="Prix actuel du kWh"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Offre UNIFEE</h2>

            <div className="rounded-xl bg-slate-100 p-4">
              <p className="text-sm text-slate-500">Prix UNIFEE du kWh</p>
              <p className="text-lg font-semibold text-slate-900">{prixUnifee} €</p>
            </div>

            <div className="rounded-xl bg-slate-100 p-4">
              <p className="text-sm text-slate-500">Abonnement UNIFEE annuel</p>
              <p className="text-lg font-semibold text-slate-900">{aboUnifee} €</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Coûts complémentaires actuels
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Abonnement actuel annuel (€)
              </label>
              <input
                type="number"
                value={abonnement}
                onChange={(e) => setAbonnement(e.target.value)}
                className="w-full rounded-xl border p-3"
                placeholder="Abonnement actuel"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Taxes actuelles annuelles (€)
              </label>
              <input
                type="number"
                value={taxes}
                onChange={(e) => setTaxes(e.target.value)}
                className="w-full rounded-xl border p-3"
                placeholder="Taxes actuelles"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={calculer}
            className="w-full rounded-xl bg-slate-900 p-4 font-semibold text-white transition hover:bg-slate-800"
          >
            Calculer mes économies
          </button>
        </div>

        {economieAnnuelle !== null && (
          <div className="space-y-5 rounded-2xl border border-green-200 bg-gradient-to-b from-green-50 to-white p-6 shadow-sm">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                Économie estimée
              </p>
              <p className="mt-2 text-5xl font-bold text-green-600">
                {economieAnnuelle.toFixed(0)} €
              </p>
              <p className="mt-2 text-base text-slate-600">
                soit {economieMensuelle?.toFixed(0)} € par mois
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-5 text-center text-white">
              <p className="text-sm uppercase tracking-wide text-slate-300">
                Réduction estimée
              </p>
              <p className="mt-2 text-3xl font-bold">
                {pourcentage?.toFixed(1)} %
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-white p-4 text-center">
                <p className="text-sm text-slate-500">Coût actuel</p>
                <p className="mt-1 text-xl font-semibold text-red-600">
                  {coutActuel?.toFixed(0)} €
                </p>
              </div>

              <div className="rounded-xl border bg-white p-4 text-center">
                <p className="text-sm text-slate-500">Offre UNIFEE</p>
                <p className="mt-1 text-xl font-semibold text-green-600">
                  {coutUnifee?.toFixed(0)} €
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-green-100 p-4 text-center">
              <p className="text-sm text-green-800">
                💡 En passant chez UNIFEE, vous économisez environ{" "}
                <span className="font-bold">{economieAnnuelle.toFixed(0)} €</span>{" "}
                par an sur votre gaz.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={genererPDF}
                className="w-full rounded-xl bg-blue-600 p-4 font-semibold text-white transition hover:bg-blue-700"
              >
                Télécharger le PDF client
              </button>

              <button
                type="button"
                onClick={enregistrerSimulation}
                className="w-full rounded-xl bg-green-600 p-4 font-semibold text-white transition hover:bg-green-700"
              >
                Enregistrer la simulation
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}