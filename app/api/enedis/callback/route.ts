import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code received" });
  }

  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("redirect_uri", process.env.ENEDIS_REDIRECT_URI!);
  body.set("client_id", process.env.ENEDIS_CLIENT_ID!);
  body.set("client_secret", process.env.ENEDIS_CLIENT_SECRET!);

  const res = await fetch("https://gw.ext.prod-sandbox.api.enedis.fr/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json();

  return NextResponse.json(data);
}