export function calculUnifee(data: {
  consoAnnuelle: number;
  puissanceSouscrite: number;
  puissanceMax: number;
}) {
  const { consoAnnuelle, puissanceSouscrite, puissanceMax } = data;

  // 🔹 Hypothèses (à améliorer plus tard)
  const prixActuel = 0.22;
  const prixUnifee = 0.18;

  const prixKVAActuel = 20;
  const prixKVAUnifee = 18;

  // 🔹 Facture actuelle
  const abonnementActuel = puissanceSouscrite * prixKVAActuel;
  const factureActuelle =
    consoAnnuelle * prixActuel + abonnementActuel;

  // 🔹 Facture Unifee
  const abonnementUnifee = puissanceSouscrite * prixKVAUnifee;
  const factureUnifee =
    consoAnnuelle * prixUnifee + abonnementUnifee;

  // 🔹 Économie brute
  let economie = factureActuelle - factureUnifee;

  // 🔥 Détection puissance surdimensionnée
  let nouvellePuissance = puissanceSouscrite;
  let gainPuissance = 0;

  if (puissanceMax < puissanceSouscrite * 0.7) {
    nouvellePuissance = Math.round(puissanceMax * 1.2);
    gainPuissance =
      (puissanceSouscrite - nouvellePuissance) * prixKVAActuel;
    economie += gainPuissance;
  }

  // 🔥 Score business
  let score = 0;

  if (consoAnnuelle > 30000) score += 2;
  if (puissanceMax < puissanceSouscrite * 0.7) score += 2;
  if (economie > 1000) score += 3;

  let potentiel = "Faible";

  if (score >= 5) potentiel = "🔥 Gros potentiel";
  else if (score >= 3) potentiel = "👍 Potentiel intéressant";

  return {
    factureActuelle,
    factureUnifee,
    economie,
    nouvellePuissance,
    gainPuissance,
    potentiel,
  };
}