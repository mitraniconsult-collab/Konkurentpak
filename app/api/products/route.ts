import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ products: [], configured: false }, { status: 503 });
  const url = new URL(request.url);
  const search = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const category = (url.searchParams.get("category") ?? "").trim().slice(0, 100);
  const minPrice = parsePrice(url.searchParams.get("minPrice"));
  const maxPrice = parsePrice(url.searchParams.get("maxPrice"));
  const page = parseInteger(url.searchParams.get("page"), 1, 1, 1000);
  const limit = parseInteger(url.searchParams.get("limit"), 24, 1, 48);
  const stockOnly = url.searchParams.get("inStock") === "true";
  const sort = url.searchParams.get("sort") ?? "name";
  if (minPrice === null || maxPrice === null || (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) || !page || !limit || !["name", "price-asc", "price-desc"].includes(sort)) {
    return NextResponse.json({ error: "Невалидни филтри." }, { status: 400 });
  }
  try {
    const where = {
      status: "ACTIVE" as const,
      ...(search ? { OR: [{ nameBg: { contains: search, mode: "insensitive" as const } }, { sku: { contains: search, mode: "insensitive" as const } }] } : {}),
      ...(category ? { category: { slug: category } } : {}),
      ...(stockOnly ? { stock: { gt: 0 } } : {}),
      ...(minPrice !== undefined || maxPrice !== undefined ? { priceCents: { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) } } : {})
    };
    const orderBy = sort === "price-asc" ? { priceCents: "asc" as const } : sort === "price-desc" ? { priceCents: "desc" as const } : { nameBg: "asc" as const };
    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({ where, select: { id: true, slug: true, sku: true, nameBg: true, nameEn: true, descriptionBg: true, priceCents: true, currency: true, stock: true, category: { select: { slug: true, nameBg: true } } }, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.product.count({ where })
    ]);
    return NextResponse.json({ products, total, page, limit, totalPages: Math.ceil(total / limit), configured: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Каталогът временно не е достъпен." }, { status: 503 }); }
}

function parseInteger(value: string | null, fallback: number, min: number, max: number) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= min && number <= max ? number : null;
}

function parsePrice(value: string | null): number | null | undefined {
  if (value === null) return undefined;
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const cents = Math.round(Number(value) * 100);
  return Number.isSafeInteger(cents) && cents >= 0 && cents <= 100000000 ? cents : null;
}
