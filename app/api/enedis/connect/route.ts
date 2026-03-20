import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.ENEDIS_CLIENT_ID;
  const redirectUri = process.env.ENEDIS_REDIRECT_URI;

  const url = new URL("https://gw.ext.prod-sandbox.api.enedis.fr/v1/oauth2/authorize");

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId!);
  url.searchParams.set("redirect_uri", redirectUri!);
  url.searchParams.set("scope", "openid");
  url.searchParams.set("state", "unifee");

  return NextResponse.redirect(url.toString());
}