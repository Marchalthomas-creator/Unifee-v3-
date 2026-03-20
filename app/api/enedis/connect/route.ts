import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.ENEDIS_CLIENT_ID;
  const redirectUri = process.env.ENEDIS_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error: "Variables Enedis manquantes",
        hasClientId: !!clientId,
        hasRedirectUri: !!redirectUri,
      },
      { status: 500 }
    );
  }

  const url = new URL(
    "https://gw.hml.api.enedis.fr/group/espace-particuliers/consentement-linky/oauth2/authorize"
  );

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", "unifee");
  url.searchParams.set("duration", "P3Y");

  return NextResponse.redirect(url.toString());
}