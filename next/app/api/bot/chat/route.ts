import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = (await req.json()) as { message?: string };
    const userText = (message ?? "").trim();

    const BOT_SERVICE_URL = process.env.BOT_SERVICE_URL;
    const BOT_API_KEY = process.env.BOT_API_KEY;

    if (!BOT_SERVICE_URL || !BOT_API_KEY) {
      return NextResponse.json(
        { reply: "Bot unavailable (server not configured)." },
        { status: 200 }
      );
    }

    const upstream = await fetch(`${BOT_SERVICE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": BOT_API_KEY,
      },
      body: JSON.stringify({ message: userText }),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      return NextResponse.json(
        { reply: `Bot unavailable (upstream ${upstream.status}).` },
        { status: 200 }
      );
    }

    return NextResponse.json({
      reply: data?.reply ?? data?.message ?? data?.text ?? "No reply from bot.",
    });
  } catch {
    return NextResponse.json(
      { reply: "Bot unavailable (request failed)." },
      { status: 200 }
    );
  }
}