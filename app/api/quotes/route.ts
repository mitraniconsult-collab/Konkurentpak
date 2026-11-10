import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
export const runtime = "nodejs";
const str = (x: unknown, max: number) => typeof x === "string" ? x.trim().slice(0, max) : "";
const int = (x: unknown) => typeof x === "number" && Number.isSafeInteger(x) ? x : NaN;
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Системата за запитвания още не е активирана." }, { status: 503 });
  if (Number(request.headers.get("content-length") || "0") > 12000) return NextResponse.json({ error: "Заявката е твърде голяма." }, { status: 413 });
  let body: Record<string, unknown>;
  try { const raw = await request.text(); if (raw.length > 12000) throw new Error("large"); body = JSON.parse(raw); if (!body || Array.isArray(body) || typeof body !== "object") throw new Error("invalid"); }
  catch { return NextResponse.json({ error: "Невалидни данни." }, { status: 400 }); }
  if (str(body.website, 200)) return NextResponse.json({ ok: true }, { status: 202 });
  const customerName = str(body.customerName, 120);
  const email = str(body.email, 254);
  const lengthMm = int(body.lengthMm), widthMm = int(body.widthMm), heightMm = int(body.heightMm), quantity = int(body.quantity);
  if (customerName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || [lengthMm,widthMm,heightMm].some(x => x < 1 || x > 10000) || quantity < 1 || quantity > 1000000) return NextResponse.json({ error: "Проверете контактите, размерите и количеството." }, { status: 400 });
  try {
    const quote = await prisma.quoteRequest.create({ data: { customerName, email, phone: str(body.phone, 50) || null, company: str(body.company, 120) || null, lengthMm, widthMm, heightMm, quantity, material: str(body.material, 120) || null, notes: str(body.notes, 2000) || null } });
    return NextResponse.json({ ok: true, reference: quote.id }, { status: 201 });
  } catch { return NextResponse.json({ error: "Възникна техническа грешка. Опитайте по-късно." }, { status: 503 }); }
}
