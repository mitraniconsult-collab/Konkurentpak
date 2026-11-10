import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ products: [], configured: false }, { status: 503 });
  const url = new URL(request.url);
  const search = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const category = (url.searchParams.get("category") ?? "").trim().slice(0, 100);
  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE", ...(search ? { nameBg: { contains: search, mode: "insensitive" as const } } : {}), ...(category ? { category: { slug: category } } : {}) },
      select: { id: true, slug: true, sku: true, nameBg: true, priceCents: true, currency: true, stock: true, category: { select: { slug: true, nameBg: true } } },
      orderBy: { nameBg: "asc" }, take: 48
    });
    return NextResponse.json({ products, configured: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Каталогът временно не е достъпен." }, { status: 503 }); }
}
