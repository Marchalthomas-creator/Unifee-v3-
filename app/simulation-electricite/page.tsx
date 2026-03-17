"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import Tesseract from "tesseract.js";

function genererId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

function normaliserTexte(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFrenchNumber(value: string) {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? "" : String(parsed);
}

function extraireValeur(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return parseFrenchNumber(match[1]);
  }
  return "";
}

function nettoyerNom(value: string) {
  return value
    .replace(/\b(mme|mr|m\.|madame|monsieur)\b/gi, "")
    .replace(/[0-9]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectSupplier(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("totalenergies") || lower.includes("total energies")) {
    return "TotalEnergies";
  }
  if (lower.includes("edf")) return "EDF";
  if (lower.includes("engie")) return "Engie";
  if (lower.includes("ekwateur")) return "Ekwateur";
  if (lower.includes("eni")) return "ENI";
  if (lower.includes("ohm energie") || lower.includes("ohm énergie")) {
    return "Ohm Énergie";
  }
  if (lower.includes("mint energie") || lower.includes("mint énergie")) {
    return "Mint Énergie";
  }

  return "";
}

function detectTypeContrat(text: string) {
  const lower = text.toLowerCase();

  const hasHC =
    lower.includes("heure creuse") ||
    lower.includes("heures creuses") ||
    lower.includes(" hc ") ||
    lower.includes("hc/");
  const hasHP =
    lower.includes("heure pleine") ||
    lower.includes("heures pleines") ||
    lower.includes(" hp ") ||
    lower.includes("hp/");

  if (hasHC || hasHP) return "hc-hp";
  return "base";
}

function extraireNomClient(text: string) {
  const patterns = [
    /raison sociale[^a-z0-9]{0,10}([A-ZÀ-ÿ][A-ZÀ-ÿa-z\s'’-]{3,60})/i,
    /client[^a-z0-9]{0,10}([A-ZÀ-ÿ][A-ZÀ-ÿa-z\s'’-]{3,60})/i,
    /nom[^a-z0-9]{0,10}([A-ZÀ-ÿ][A-ZÀ-ÿa-z\s'’-]{3,60})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const nom = nettoyerNom(match[1]);
      if (nom.length >= 3) return nom;
    }
  }

  return "";
}

function extraireVille(text: string) {
  const patterns = [
    /adresse de consommation[^0-9]{0,20}[0-9]{0,5}\s*[A-Za-zÀ-ÿ0-9\s,'’-]*\b([A-ZÀ-ÿ][A-Za-zÀ-ÿ'’ -]{2,40})\b/i,
    /adresse[^0-9]{0,20}[0-9]{5}\s+([A-ZÀ-ÿ][A-Za-zÀ-ÿ'’ -]{2,40})/i,
    /consommation[^0-9]{0,40}[0-9]{5}\s+([A-ZÀ-ÿ][A-Za-zÀ-ÿ'’ -]{2,40})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const ville = match[1].replace(/\s+/g, " ").trim();
      if (ville.length >= 2) return ville;
    }
  }

  return "";
}

export default function SimulationElectricitePage() {
  const router = useRouter();

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  const [puissanceSouscrite, setPuissanceSouscrite] = useState("");
  const [puissanceMax, setPuissanceMax] = useState("");

  const [facture, setFacture] = useState<File | null>(null);
  const [messageExtraction, setMessageExtraction] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

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

  function gererSelectionFacture(file: File | null) {
    if (!file) return;
    setFacture(file);
    setMessageExtraction("");
    setOcrText("");
  }

  async function extraireFacture() {
    if (!facture) {
      setMessageExtraction("Veuillez d’abord charger une photo ou une facture.");
      return;
    }

    if (facture.type === "application/pdf") {
      setMessageExtraction(
        "La lecture automatique des PDF sera ajoutée à l’étape suivante. Pour l’instant, utilise une photo ou une capture de la facture."
      );
      return;
    }

    try {
      setIsExtracting(true);
      setMessageExtraction("Analyse de la facture en cours...");

      const result = await Tesseract.recognize(facture, "fra+eng", {
        logger: () => {},
      });

      const rawText = result.data.text || "";
      const text = normaliserTexte(rawText);

      setOcrText(text);

      const supplier = detectSupplier(text);
      if (supplier) setFournisseur(supplier);

      const nomDetecte = extraireNomClient(text);
      if (nomDetecte && !nomClient) setNomClient(nomDetecte);

      const villeDetectee = extraireVille(text);
      if (villeDetectee && !ville) setVille(villeDetectee);

      const contrat = detectTypeContrat(text);
      setTypeContrat(contrat);

      const consoBase = extraireValeur(text, [
        /total consommation[^0-9]{0,25}([0-9\s]+[.,]?[0-9]*)\s*kwh/i,
        /consommation annuelle[^0-9]{0,25}([0-9\s]+[.,]?[0-9]*)\s*kwh/i,
        /consommation[^0-9]{0,25}([0-9\s]+[.,]?[0-9]*)\s*kwh/i,
        /conso[^0-9]{0,25}([0-9\s]+[.,]?[0-9]*)\s*kwh/i,
      ]);

      const prixBase = extraireValeur(text, [
        /prix[^0-9]{0,15}kwh[^0-9]{0,20}([0-9]+[.,][0-9]+)/i,
        /([0-9]+[.,][0-9]+)\s*€?\s*\/\s*kwh/i,
      ]);

      const abonnementDetecte = extraireValeur(text, [
        /total abonnement[^0-9]{0,30}([0-9]+[.,][0-9]+)/i,
        /abonnement[^0-9]{0,25}([0-9]+[.,][0-9]+)\s*€/i,
      ]);

      const puissanceDetectee = extraireValeur(text, [
        /puissance souscrite[^0-9]{0,25}([0-9]+[.,]?[0-9]*)\s*kva/i,
        /([0-9]+[.,]?[0-9]*)\s*kva[^a-z]/i,
      ]);

      const puissanceMaxDetectee = extraireValeur(text, [
        /puissance max[^0-9]{0,25}([0-9]+[.,]?[0-9]*)\s*kva/i,
        /max utilisée[^0-9]{0,25}([0-9]+[.,]?[0-9]*)\s*kva/i,
      ]);

      const hpPriceMatch = text.match(
        /(?:heures?\s*pleines?|hp)[^0-9]{0,40}([0-9]+[.,][0-9]+)/i
      );
      const hcPriceMatch = text.match(
        /(?:heures?\s*creuses?|hc)[^0-9]{0,40}([0-9]+[.,][0-9]+)/i
      );

      const hpConsoMatch = text.match(
        /(?:heures?\s*pleines?|hp)[^0-9]{0,50}([0-9\s]+[.,]?[0-9]*)\s*kwh/i
      );
      const hcConsoMatch = text.match(
        /(?:heures?\s*creuses?|hc)[^0-9]{0,50}([0-9\s]+[.,]?[0-9]*)\s*kwh/i
      );

      if (contrat === "base") {
        if (consoBase) setConsommation(consoBase);
        if (prixBase) setPrixKwh(prixBase);
      }

      if (abonnementDetecte) setAbonnement(abonnementDetecte);
      if (puissanceDetectee) setPuissanceSouscrite(puissanceDetectee);
      if (puissanceMaxDetectee) setPuissanceMax(puissanceMaxDetectee);

      if (hpPriceMatch?.[1]) setPrixHP(parseFrenchNumber(hpPriceMatch[1]));
      if (hcPriceMatch?.[1]) setPrixHC(parseFrenchNumber(hcPriceMatch[1]));
      if (hpConsoMatch?.[1]) setConsoHP(parseFrenchNumber(hpConsoMatch[1]));
      if (hcConsoMatch?.[1]) setConsoHC(parseFrenchNumber(hcConsoMatch[1]));

      if (
        !supplier &&
        !nomDetecte &&
        !villeDetectee &&
        !consoBase &&
        !prixBase &&
        !abonnementDetecte &&
        !hpPriceMatch &&
        !hcPriceMatch
      ) {
        setMessageExtraction(
          "Analyse terminée, mais peu d’informations ont été trouvées. Essaie avec une photo plus nette, mieux cadrée et plus proche du tableau."
        );
      } else {
        setMessageExtraction(
          "Analyse terminée. Les champs détectés ont été préremplis. Vérifie et corrige si nécessaire."
        );
      }
    } catch (error) {
      console.error(error);
      setMessageExtraction(
        "Impossible d’analyser la facture. Essaie avec une photo plus nette."
      );
    } finally {
      setIsExtracting(false);
    }
  }

  function calculer() {
    const abo = parseFloat(abonnement) || 0;

    let totalActuelHT = 0;
    let totalUnifeeHT = 0;

    if (typeContrat === "base") {
      const conso = parseFloat(consommation) || 0;
      const prix = parseFloat(prixKwh) || 0;

      const prixU = parseFloat(prixUnifee) || 0;
      const aboU = parseFloat(aboUnifee) || 0;

      totalActuelHT = conso * prix + abo;
      totalUnifeeHT = conso * prixU + aboU;
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

      totalActuelHT = totalEnergieActuelle + abo;
      totalUnifeeHT = totalEnergieUnifee + aboU;
    }

    const coefficientReglemente = 1.12;
    const totalActuel = totalActuelHT * coefficientReglemente;
    const totalUnifee = totalUnifeeHT * coefficientReglemente;

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
    doc.text("UNIFEE - Simulation Électricité", 20, 20);

    doc.setFontSize(11);
    doc.text(`Client : ${nomClient || "-"}`, 20, 35);
    doc.text(`Ville : ${ville || "-"}`, 20, 43);
    doc.text(`Fournisseur : ${fournisseur || "-"}`, 20, 51);
    doc.text(
      `Type de contrat : ${
        typeContrat === "base"
          ? "Option Base"
          : "Heures Pleines / Heures Creuses"
      }`,
      20,
      59
    );

    doc.setFontSize(14);
    doc.text("Résultat de la simulation", 20, 75);

    doc.setFontSize(12);
    doc.text(`Coût actuel annuel estimé : ${coutActuel.toFixed(0)} €`, 20, 88);
    doc.text(`Coût annuel estimé avec UNIFEE : ${coutUnifee.toFixed(0)} €`, 20, 96);
    doc.text(`Économie annuelle estimée : ${economieAnnuelle.toFixed(0)} €`, 20, 108);
    doc.text(`Économie mensuelle estimée : ${economieMensuelle?.toFixed(0)} €`, 20, 116);
    doc.text(`Réduction estimée : ${pourcentage?.toFixed(1)} %`, 20, 124);

    doc.setTextColor(0, 128, 0);
    doc.text(
      `Les taxes et coûts réseau réglementés sont intégrés automatiquement dans le calcul.`,
      20,
      140
    );

    doc.setTextColor(0, 0, 0);
    doc.save(`simulation-electricite-${nomClient || "client"}.pdf`);
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
      puissanceSouscrite,
      puissanceMax,
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

        <div className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Informations client
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Nom du client
              </label>
              <input
                type="text"
                value={nomClient}
                onChange={(e) => setNomClient(e.target.value)}
                className="w-full rounded-xl border p-3"
                placeholder="Nom du client"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Ville
              </label>
              <input
                type="text"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="w-full rounded-xl border p-3"
                placeholder="Ville"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Fournisseur actuel
              </label>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Type de contrat
              </label>
              <select
                value={typeContrat}
                onChange={(e) => setTypeContrat(e.target.value)}
                className="w-full rounded-xl border p-3"
              >
                <option value="base">Option Base</option>
                <option value="hc-hp">Heures Pleines / Heures Creuses</option>
              </select>
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
              disabled={isExtracting}
              className="mt-4 w-full rounded-xl bg-blue-600 p-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {isExtracting ? "Extraction en cours..." : "Extraire les informations"}
            </button>

            {messageExtraction && (
              <p className="mt-3 text-sm text-slate-600">{messageExtraction}</p>
            )}
          </div>

          {ocrText && (
            <details className="rounded-xl border bg-slate-50 p-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-700">
                Voir le texte détecté
              </summary>
              <pre className="mt-3 whitespace-pre-wrap text-xs text-slate-600">
                {ocrText}
              </pre>
            </details>
          )}

          {typeContrat === "base" && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Votre consommation actuelle
              </h2>

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
          )}

          {typeContrat === "hc-hp" && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Votre consommation actuelle
              </h2>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Prix kWh heure pleine (€)
                </label>
                <input
                  type="number"
                  value={prixHP}
                  onChange={(e) => setPrixHP(e.target.value)}
                  className="w-full rounded-xl border p-3"
                  placeholder="Prix HP"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Consommation heure pleine (kWh)
                </label>
                <input
                  type="number"
                  value={consoHP}
                  onChange={(e) => setConsoHP(e.target.value)}
                  className="w-full rounded-xl border p-3"
                  placeholder="Consommation HP"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Prix kWh heure creuse (€)
                </label>
                <input
                  type="number"
                  value={prixHC}
                  onChange={(e) => setPrixHC(e.target.value)}
                  className="w-full rounded-xl border p-3"
                  placeholder="Prix HC"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Consommation heure creuse (kWh)
                </label>
                <input
                  type="number"
                  value={consoHC}
                  onChange={(e) => setConsoHC(e.target.value)}
                  className="w-full rounded-xl border p-3"
                  placeholder="Consommation HC"
                />
              </div>

              {prixMoyenActuel !== null && (
                <div className="rounded-xl bg-slate-100 p-4">
                  <p className="text-sm text-slate-500">Prix moyen actuel</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {prixMoyenActuel.toFixed(4)} €/kWh
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Autres coûts de la facture actuelle
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
                Puissance souscrite (kVA)
              </label>
              <input
                type="number"
                value={puissanceSouscrite}
                onChange={(e) => setPuissanceSouscrite(e.target.value)}
                className="w-full rounded-xl border p-3"
                placeholder="Puissance souscrite"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Puissance max utilisée (kVA)
              </label>
              <input
                type="number"
                value={puissanceMax}
                onChange={(e) => setPuissanceMax(e.target.value)}
                className="w-full rounded-xl border p-3"
                placeholder="Puissance max utilisée"
              />
            </div>
          </div>

          {typeContrat === "base" && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Votre offre UNIFEE
              </h2>

              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Prix UNIFEE du kWh</p>
                <p className="text-lg font-semibold text-slate-900">{prixUnifee} €</p>
              </div>

              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Abonnement UNIFEE annuel</p>
                <p className="text-lg font-semibold text-slate-900">{aboUnifee} €</p>
              </div>
            </div>
          )}

          {typeContrat === "hc-hp" && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Votre offre UNIFEE
              </h2>

              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Prix UNIFEE heure pleine</p>
                <p className="text-lg font-semibold text-slate-900">{prixUnifeeHP} €</p>
              </div>

              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Prix UNIFEE heure creuse</p>
                <p className="text-lg font-semibold text-slate-900">{prixUnifeeHC} €</p>
              </div>

              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-sm text-slate-500">Abonnement UNIFEE annuel</p>
                <p className="text-lg font-semibold text-slate-900">{aboUnifeeHcHp} €</p>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
            💡 Les taxes et coûts réseau sont réglementés et identiques quel que soit
            le fournisseur. Ils sont intégrés automatiquement dans le calcul.
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
                par an sur votre électricité.
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