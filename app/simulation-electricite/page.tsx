"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import Tesseract from "tesseract.js";

type TypeContrat = "standard" | "hp-hc" | "autres";
type Etape = "choix" | "formulaire";

function genererId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

function normaliserTexte(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[|]/g, " ")
    .replace(/[€]/g, " € ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFrenchNumber(value: string) {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? "" : String(parsed);
}

function toNumber(value: string) {
  const parsed = parseFloat(String(value).replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
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

function detectTypeContrat(text: string): TypeContrat {
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

  if (hasHC || hasHP) return "hp-hc";
  return "standard";
}

function extraireNomClient(text: string) {
  const patterns = [
    /raison sociale[^a-z0-9]{0,10}([A-ZÀ-ÿ][A-ZÀ-ÿa-z\s'’\-&]{3,80})/i,
    /client[^a-z0-9]{0,10}([A-ZÀ-ÿ][A-ZÀ-ÿa-z\s'’\-&]{3,80})/i,
    /nom[^a-z0-9]{0,10}([A-ZÀ-ÿ][A-ZÀ-ÿa-z\s'’\-&]{3,80})/i,
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
    /adresse[^0-9]{0,30}[0-9]{5}\s+([A-ZÀ-ÿ][A-Za-zÀ-ÿ'’ \-]{2,40})/i,
    /consommation[^0-9]{0,40}[0-9]{5}\s+([A-ZÀ-ÿ][A-Za-zÀ-ÿ'’ \-]{2,40})/i,
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

function extraireDateFin(text: string) {
  const patterns = [
    /fin d[’']engagement[^0-9]{0,20}([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i,
    /date de fin[^0-9]{0,20}([0-9]{2}\/[0-9]{2}\/[0-9]{4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const [jour, mois, annee] = match[1].split("/");
      return `${annee}-${mois}-${jour}`;
    }
  }

  return "";
}

function extraireHPHC(text: string) {
  const clean = text.toLowerCase().replace(/\s+/g, " ");

  const prixHP =
    clean.match(/hp[^0-9]{0,20}([0-9]+[.,][0-9]+)/) ||
    clean.match(/pleine[^0-9]{0,20}([0-9]+[.,][0-9]+)/);

  const prixHC =
    clean.match(/hc[^0-9]{0,20}([0-9]+[.,][0-9]+)/) ||
    clean.match(/creuse[^0-9]{0,20}([0-9]+[.,][0-9]+)/);

  const consoHP =
    clean.match(/hp[^0-9]{0,30}([0-9\s]+)\s*kwh/) ||
    clean.match(/pleine[^0-9]{0,30}([0-9\s]+)\s*kwh/);

  const consoHC =
    clean.match(/hc[^0-9]{0,30}([0-9\s]+)\s*kwh/) ||
    clean.match(/creuse[^0-9]{0,30}([0-9\s]+)\s*kwh/);

  return {
    prixHP: prixHP?.[1] || "",
    prixHC: prixHC?.[1] || "",
    consoHP: consoHP?.[1] || "",
    consoHC: consoHC?.[1] || "",
  };
}

export default function SimulationElectricitePage() {
  const router = useRouter();

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [etape, setEtape] = useState<Etape>("choix");
  const [typeContrat, setTypeContrat] = useState<TypeContrat>("standard");

  const [nomClient, setNomClient] = useState("");
  const [ville, setVille] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [dateFin, setDateFin] = useState("");

  const [consommation, setConsommation] = useState("");
  const [prixKwh, setPrixKwh] = useState("");

  const [prixHP, setPrixHP] = useState("");
  const [consoHP, setConsoHP] = useState("");
  const [prixHC, setPrixHC] = useState("");
  const [consoHC, setConsoHC] = useState("");

  const [libelleAutreContrat, setLibelleAutreContrat] = useState("");
  const [prixMoyenAutre, setPrixMoyenAutre] = useState("");
  const [detailsAutreContrat, setDetailsAutreContrat] = useState("");

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
    if (!saved) return;

    try {
      const settings = JSON.parse(saved);
      setPrixUnifee(settings.electriciteBasePrix || "0.18");
      setAboUnifee(settings.electriciteBaseAbo || "120");
      setPrixUnifeeHP(settings.electriciteHPPrix || "0.20");
      setPrixUnifeeHC(settings.electriciteHCPrix || "0.16");
      setAboUnifeeHcHp(settings.electriciteHCAbo || "130");
    } catch {
      // no-op
    }
  }, []);

  function resetResultats() {
    setCoutActuel(null);
    setCoutUnifee(null);
    setEconomieAnnuelle(null);
    setEconomieMensuelle(null);
    setPourcentage(null);
    setPrixMoyenActuel(null);
  }

  function choisirContrat(contrat: TypeContrat) {
  setTypeContrat(contrat);
  setEtape("formulaire");

  // 🔥 RESET COMPLET
  setFacture(null);
  setOcrText("");
  setMessageExtraction("");

  if (photoInputRef.current) photoInputRef.current.value = "";
  if (fileInputRef.current) fileInputRef.current.value = "";

  resetResultats();
}

  function retourChoixContrat() {
  setEtape("choix");

  setFacture(null);
  setOcrText("");
  setMessageExtraction("");

  if (photoInputRef.current) photoInputRef.current.value = "";
  if (fileInputRef.current) fileInputRef.current.value = "";

  resetResultats();
}

  function gererSelectionFacture(file: File | null) {
    if (!file) return;
    setFacture(file);
    setMessageExtraction("");
    setOcrText("");
    resetResultats();
  }

  async function extraireFacture() {
    if (!facture) {
      setMessageExtraction("Veuillez d’abord charger une photo ou une facture.");
      return;
    }

    if (facture.type === "application/pdf") {
      setMessageExtraction(
        "La lecture automatique des PDF n’est pas encore activée. Utilise pour le moment une photo ou une capture d’écran de la facture."
      );
      return;
    }

    try {
      setIsExtracting(true);
      setMessageExtraction("Analyse de la facture en cours...");
      resetResultats();

      const result = await Tesseract.recognize(facture, "fra+eng", {
        logger: () => {},
      });

      const rawText = result.data.text || "";
      const text = normaliserTexte(rawText);
      setOcrText(text);

      const supplier = detectSupplier(text);
      if (supplier) setFournisseur(supplier);

      const nomDetecte = extraireNomClient(text);
      if (nomDetecte) setNomClient(nomDetecte);

      const villeDetectee = extraireVille(text);
      if (villeDetectee) setVille(villeDetectee);

      const dateFinDetectee = extraireDateFin(text);
      if (dateFinDetectee) setDateFin(dateFinDetectee);

      const contratDetecte = detectTypeContrat(text);
      setTypeContrat(contratDetecte);

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
        /([0-9]+[.,]?[0-9]*)\s*kva/i,
      ]);

      const puissanceMaxDetectee = extraireValeur(text, [
        /puissance max[^0-9]{0,25}([0-9]+[.,]?[0-9]*)\s*kva/i,
        /max utilisée[^0-9]{0,25}([0-9]+[.,]?[0-9]*)\s*kva/i,
      ]);

     const hpData = extraireHPHC( text)


      if (contratDetecte === "standard") {
        if (consoBase) setConsommation(consoBase);
        if (prixBase) setPrixKwh(prixBase);
      }

      if (contratDetecte === "hp-hc") {
  if (hpData.prixHP) setPrixHP(parseFrenchNumber(hpData.prixHP));
  if (hpData.prixHC) setPrixHC(parseFrenchNumber(hpData.prixHC));
  if (hpData.consoHP) setConsoHP(parseFrenchNumber(hpData.consoHP));
  if (hpData.consoHC) setConsoHC(parseFrenchNumber(hpData.consoHC));
}

      if (contratDetecte === "autres") {
        if (consoBase) setConsommation(consoBase);
        if (prixBase) setPrixMoyenAutre(prixBase);
        if (!libelleAutreContrat) {
          setLibelleAutreContrat("Autre contrat détecté");
        }
      }

      if (abonnementDetecte) setAbonnement(abonnementDetecte);
      if (puissanceDetectee) setPuissanceSouscrite(puissanceDetectee);
      if (puissanceMaxDetectee) setPuissanceMax(puissanceMaxDetectee);

      const hasUsefulData =
  !!supplier ||
  !!nomDetecte ||
  !!villeDetectee ||
  !!dateFinDetectee ||
  !!consoBase ||
  !!prixBase ||
  !!abonnementDetecte ||
  !!hpData?.prixHP ||
  !!hpData?.prixHC ||
  !!hpData?.consoHP ||
  !!hpData?.consoHC;

      setMessageExtraction(
        hasUsefulData
          ? "Analyse terminée. Les champs détectés ont été préremplis. Vérifie et corrige si nécessaire."
          : "Analyse terminée, mais peu d’informations ont été trouvées. Essaie avec une photo plus nette, mieux cadrée et plus proche du tableau."
      );
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
    resetResultats();

    const abo = toNumber(abonnement);

    let totalActuelHT = 0;
    let totalUnifeeHT = 0;
    let prixMoyen = 0;

    if (typeContrat === "standard") {
      const conso = toNumber(consommation);
      const prix = toNumber(prixKwh);

      const prixU = toNumber(prixUnifee);
      const aboU = toNumber(aboUnifee);

      totalActuelHT = conso * prix + abo;
      totalUnifeeHT = conso * prixU + aboU;
      prixMoyen = prix;
    }

    if (typeContrat === "hp-hc") {
      const hp = toNumber(consoHP);
      const hc = toNumber(consoHC);
      const prixHpVal = toNumber(prixHP);
      const prixHcVal = toNumber(prixHC);

      const prixHpU = toNumber(prixUnifeeHP);
      const prixHcU = toNumber(prixUnifeeHC);
      const aboU = toNumber(aboUnifeeHcHp);

      const totalConso = hp + hc;
      const totalEnergieActuelle = hp * prixHpVal + hc * prixHcVal;
      const totalEnergieUnifee = hp * prixHpU + hc * prixHcU;

      totalActuelHT = totalEnergieActuelle + abo;
      totalUnifeeHT = totalEnergieUnifee + aboU;
      prixMoyen = totalConso > 0 ? totalEnergieActuelle / totalConso : 0;
    }

    if (typeContrat === "autres") {
      const conso = toNumber(consommation);
      const prix = toNumber(prixMoyenAutre);

      const prixU = toNumber(prixUnifee);
      const aboU = toNumber(aboUnifee);

      totalActuelHT = conso * prix + abo;
      totalUnifeeHT = conso * prixU + aboU;
      prixMoyen = prix;
    }

    const coefficientReglemente = 1.12;
    const totalActuel = totalActuelHT * coefficientReglemente;
    const totalUnifee = totalUnifeeHT * coefficientReglemente;
    const economie = totalActuel - totalUnifee;
    const mensuel = economie / 12;
    const reduction = totalActuel > 0 ? (economie / totalActuel) * 100 : 0;

    setPrixMoyenActuel(prixMoyen);
    setCoutActuel(totalActuel);
    setCoutUnifee(totalUnifee);
    setEconomieAnnuelle(economie);
    setEconomieMensuelle(mensuel);
    setPourcentage(reduction);
  }

  function genererPDF() {
    if (
      coutActuel === null ||
      coutUnifee === null ||
      economieAnnuelle === null ||
      economieMensuelle === null ||
      pourcentage === null
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
    doc.text(`Type de contrat : ${typeContrat}`, 20, 59);

    doc.setFontSize(14);
    doc.text("Résultat de la simulation", 20, 76);

    doc.setFontSize(12);
    doc.text(`Coût actuel annuel estimé : ${coutActuel.toFixed(0)} €`, 20, 89);
    doc.text(`Coût annuel estimé avec UNIFEE : ${coutUnifee.toFixed(0)} €`, 20, 97);
    doc.text(`Économie annuelle estimée : ${economieAnnuelle.toFixed(0)} €`, 20, 109);
    doc.text(`Économie mensuelle estimée : ${economieMensuelle.toFixed(0)} €`, 20, 117);
    doc.text(`Réduction estimée : ${pourcentage.toFixed(1)} %`, 20, 125);

    doc.setTextColor(0, 128, 0);
    doc.text(
      "Les taxes et coûts réseau réglementés sont intégrés automatiquement dans le calcul.",
      20,
      141
    );

    doc.setTextColor(0, 0, 0);
    doc.save(`simulation-electricite-${nomClient || "client"}.pdf`);
  }

  function enregistrerSimulation() {
    if (
      coutActuel === null ||
      coutUnifee === null ||
      economieAnnuelle === null ||
      economieMensuelle === null ||
      pourcentage === null
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
      libelleAutreContrat,
      prixMoyenAutre,
      detailsAutreContrat,
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

  if (etape === "choix") {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff_0%,_#f8fafc_45%,_#f8fafc_100%)] px-5 py-10">
        <div className="mx-auto max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
            >
              ← Retour
            </button>
            <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm">
              UNIFEE
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">
                Électricité
              </p>
              <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900">
                Choisissez le type de contrat
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Sélectionnez d’abord la bonne structure tarifaire pour afficher le
                formulaire adapté.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <button
                type="button"
                onClick={() => choisirContrat("standard")}
                className="group w-full rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-semibold text-slate-900">
                      Standard
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Prix unique du kWh
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition group-hover:bg-slate-900 group-hover:text-white">
                    Choisir
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => choisirContrat("hp-hc")}
                className="group w-full rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-semibold text-slate-900">
                      Heures pleines / Heures creuses
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Deux prix et deux consommations
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition group-hover:bg-slate-900 group-hover:text-white">
                    Choisir
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => choisirContrat("autres")}
                className="group w-full rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-semibold text-slate-900">
                      Autres
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Offre spécifique ou contrat non standard
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition group-hover:bg-slate-900 group-hover:text-white">
                    Choisir
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef4ff_0%,_#f8fafc_45%,_#f8fafc_100%)] px-5 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={retourChoixContrat}
            className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
          >
            ← Contrats
          </button>

          <div className="text-right">
            <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm inline-block">
              UNIFEE
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Contrat :{" "}
              <span className="font-semibold text-slate-800">
                {typeContrat === "standard"
                  ? "Standard"
                  : typeContrat === "hp-hc"
                  ? "Heures pleines / Heures creuses"
                  : "Autres"}
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-5 rounded-[30px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/60 p-5">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Charger une facture
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Essayez de préremplir automatiquement un maximum d’informations
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Prendre une photo
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Importer une facture
              </button>
            </div>
<button
  onClick={() => {
    window.location.href = "/api/enedis/connect";
  }}
  className="mt-4 w-full rounded-xl bg-green-600 text-white py-3 font-semibold"
>
  Connecter mon compteur Enedis
</button>
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
              <div className="mt-3 rounded-2xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                Fichier sélectionné : {facture.name}
              </div>
            )}

            <button
              type="button"
              onClick={extraireFacture}
              disabled={isExtracting}
              className="mt-4 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExtracting ? "Extraction en cours..." : "Extraire les informations"}
            </button>

            {messageExtraction && (
              <p className="mt-3 text-sm leading-6 text-slate-600">{messageExtraction}</p>
            )}
          </div>

          {ocrText && (
            <details className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                Voir le texte OCR détecté
              </summary>
              <pre className="mt-3 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                {ocrText}
              </pre>
            </details>
          )}

          <section className="rounded-[24px] border border-slate-100 bg-white p-1">
            <div className="space-y-4 rounded-[20px] bg-white p-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Informations client
              </h2>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Nom du client
                </label>
                <input
                  type="text"
                  value={nomClient}
                  onChange={(e) => setNomClient(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Nom du client"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Ville</label>
                <input
                  type="text"
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Ville"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Fournisseur actuel
                </label>
                <input
                  type="text"
                  value={fournisseur}
                  onChange={(e) => setFournisseur(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Nom du fournisseur"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Date de fin d’engagement
                </label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

          {typeContrat === "standard" && (
            <section className="space-y-4 rounded-[24px] border border-slate-100 bg-white p-5">
              <h2 className="text-2xl font-bold text-slate-900">
                Votre consommation actuelle
              </h2>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Consommation annuelle (kWh)
                </label>
                <input
                  type="number"
                  value={consommation}
                  onChange={(e) => setConsommation(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Consommation annuelle"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Prix actuel du kWh (€)
                </label>
                <input
                  type="number"
                  value={prixKwh}
                  onChange={(e) => setPrixKwh(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Prix actuel du kWh"
                />
              </div>
            </section>
          )}

          {typeContrat === "hp-hc" && (
            <section className="space-y-4 rounded-[24px] border border-slate-100 bg-white p-5">
              <h2 className="text-2xl font-bold text-slate-900">
                Votre consommation actuelle
              </h2>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Prix kWh heure pleine (€)
                </label>
                <input
                  type="number"
                  value={prixHP}
                  onChange={(e) => setPrixHP(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Prix HP"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Consommation heure pleine (kWh)
                </label>
                <input
                  type="number"
                  value={consoHP}
                  onChange={(e) => setConsoHP(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Consommation HP"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Prix kWh heure creuse (€)
                </label>
                <input
                  type="number"
                  value={prixHC}
                  onChange={(e) => setPrixHC(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Prix HC"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Consommation heure creuse (kWh)
                </label>
                <input
                  type="number"
                  value={consoHC}
                  onChange={(e) => setConsoHC(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Consommation HC"
                />
              </div>
            </section>
          )}

          {typeContrat === "autres" && (
            <section className="space-y-4 rounded-[24px] border border-slate-100 bg-white p-5">
              <h2 className="text-2xl font-bold text-slate-900">
                Votre consommation actuelle
              </h2>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Nom du contrat / formule
                </label>
                <input
                  type="text"
                  value={libelleAutreContrat}
                  onChange={(e) => setLibelleAutreContrat(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Exemple : offre pro spécifique"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Consommation annuelle (kWh)
                </label>
                <input
                  type="number"
                  value={consommation}
                  onChange={(e) => setConsommation(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Consommation annuelle"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Prix moyen constaté du kWh (€)
                </label>
                <input
                  type="number"
                  value={prixMoyenAutre}
                  onChange={(e) => setPrixMoyenAutre(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Prix moyen du kWh"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Détails complémentaires
                </label>
                <textarea
                  value={detailsAutreContrat}
                  onChange={(e) => setDetailsAutreContrat(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Notes libres sur le contrat"
                  rows={4}
                />
              </div>
            </section>
          )}

          <section className="space-y-4 rounded-[24px] border border-slate-100 bg-white p-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Autres coûts de la facture actuelle
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Abonnement actuel annuel (€)
              </label>
              <input
                type="number"
                value={abonnement}
                onChange={(e) => setAbonnement(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Abonnement actuel"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Puissance souscrite (kVA)
              </label>
              <input
                type="number"
                value={puissanceSouscrite}
                onChange={(e) => setPuissanceSouscrite(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Puissance souscrite"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Puissance max utilisée (kVA)
              </label>
              <input
                type="number"
                value={puissanceMax}
                onChange={(e) => setPuissanceMax(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Puissance max utilisée"
              />
            </div>
          </section>

          {typeContrat === "standard" && (
            <section className="space-y-4 rounded-[24px] bg-gradient-to-br from-slate-50 to-blue-50 p-5">
              <h2 className="text-2xl font-bold text-slate-900">
                Votre offre UNIFEE
              </h2>

              <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Prix UNIFEE du kWh</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{prixUnifee} €</p>
              </div>

              <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Abonnement UNIFEE annuel
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{aboUnifee} €</p>
              </div>
            </section>
          )}

          {typeContrat === "hp-hc" && (
            <section className="space-y-4 rounded-[24px] bg-gradient-to-br from-slate-50 to-blue-50 p-5">
              <h2 className="text-2xl font-bold text-slate-900">
                Votre offre UNIFEE
              </h2>

              <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Prix UNIFEE heure pleine
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{prixUnifeeHP} €</p>
              </div>

              <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Prix UNIFEE heure creuse
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{prixUnifeeHC} €</p>
              </div>

              <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Abonnement UNIFEE annuel
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {aboUnifeeHcHp} €
                </p>
              </div>
            </section>
          )}

          {typeContrat === "autres" && (
            <section className="space-y-4 rounded-[24px] bg-gradient-to-br from-slate-50 to-blue-50 p-5">
              <h2 className="text-2xl font-bold text-slate-900">
                Votre offre UNIFEE
              </h2>

              <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Prix UNIFEE du kWh</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{prixUnifee} €</p>
              </div>

              <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">
                  Abonnement UNIFEE annuel
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{aboUnifee} €</p>
              </div>
            </section>
          )}

          <div className="rounded-[24px] bg-slate-100 p-5 text-base leading-8 text-slate-600">
            💡 Les taxes et coûts réseau sont réglementés et identiques quel que soit le fournisseur. Ils sont intégrés automatiquement dans le calcul.
          </div>

          <button
            type="button"
            onClick={calculer}
            className="w-full rounded-[22px] bg-slate-900 px-4 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Calculer mes économies
          </button>
        </div>

        {economieAnnuelle !== null &&
          coutActuel !== null &&
          coutUnifee !== null &&
          economieMensuelle !== null &&
          pourcentage !== null && (
            <div className="space-y-5 rounded-[30px] border border-green-200 bg-gradient-to-b from-green-50 to-white p-6 shadow-[0_12px_40px_rgba(34,197,94,0.10)]">
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Économie estimée
                </p>
                <p className="mt-3 text-5xl font-bold text-green-600">
                  {economieAnnuelle.toFixed(0)} €
                </p>
                <p className="mt-2 text-base text-slate-600">
                  soit {economieMensuelle.toFixed(0)} € par mois
                </p>
              </div>

              <div className="rounded-[24px] bg-slate-900 p-5 text-center text-white">
                <p className="text-sm uppercase tracking-wide text-slate-300">
                  Réduction estimée
                </p>
                <p className="mt-2 text-3xl font-bold">{pourcentage.toFixed(1)} %</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                  <p className="text-sm text-slate-500">Coût actuel</p>
                  <p className="mt-1 text-xl font-semibold text-red-600">
                    {coutActuel.toFixed(0)} €
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                  <p className="text-sm text-slate-500">Offre UNIFEE</p>
                  <p className="mt-1 text-xl font-semibold text-green-600">
                    {coutUnifee.toFixed(0)} €
                  </p>
                </div>
              </div>

              {prixMoyenActuel !== null && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                  <p className="text-sm text-slate-500">Prix moyen actuel</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {prixMoyenActuel.toFixed(4)} €/kWh
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-green-100 p-4 text-center">
                <p className="text-sm leading-7 text-green-800">
                  En passant chez <span className="font-bold">UNIFEE</span>, vous
                  économisez environ{" "}
                  <span className="font-bold">{economieAnnuelle.toFixed(0)} €</span>{" "}
                  par an sur votre électricité.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={genererPDF}
                  className="w-full rounded-2xl bg-blue-600 px-4 py-4 font-semibold text-white transition hover:bg-blue-700"
                >
                  Télécharger le PDF client
                </button>

                <button
                  type="button"
                  onClick={enregistrerSimulation}
                  className="w-full rounded-2xl bg-green-600 px-4 py-4 font-semibold text-white transition hover:bg-green-700"
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