import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { authorizeAdmin } from "../../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };
const unauthorized = () => NextResponse.json({ error: "Нямате достъп до администрацията." }, { status: 401, headers: noStore });

export async function GET(request: Request) {
  if (!await authorizeAdmin(request)) return unauthorized();
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Базата данни още не е свързана." }, { status: 503 });
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 80);
  try {
    const [products, categories] = await prisma.$transaction([
      prisma.product.findMany({
        where: q ? { OR: [{ nameBg: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } : {},
        select: { id: true, sku: true, slug: true, nameBg: true, nameEn: true, descriptionBg: true, descriptionEn: true, priceCents: true, stock: true, status: true, categoryId: true },
        orderBy: { updatedAt: "desc" }, take: 100
      }),
      prisma.category.findMany({ select: { id: true, nameBg: true, slug: true }, orderBy: { nameBg: "asc" } })
    ]);
    return NextResponse.json({ products, categories }, { headers: noStore });
  } catch { return NextResponse.json({ error: "Неуспешно зареждане на каталога." }, { status: 503 }); }
}

function validate(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const data = input as Record<string, unknown>;
  const str = (key: string, max: number) => typeof data[key] === "string" ? (data[key] as string).trim().slice(0, max) : "";
  const sku = str("sku", 80), slug = str("slug", 120), nameBg = str("nameBg", 250), categoryId = str("categoryId", 100);
  const price = data.priceCents, stock = data.stock;
  const status = data.status;
  if (!sku || !/^[a-z0-9][a-z0-9-]*$/.test(slug) || !nameBg || !categoryId ||
      !Number.isSafeInteger(price) || (price as number) < 0 || (price as number) > 100000000 ||
      !Number.isSafeInteger(stock) || (stock as number) < 0 || (stock as number) > 10000000 ||
      !["DRAFT", "ACTIVE", "ARCHIVED"].includes(String(status))) return null;
  return {
    sku, slug, nameBg, categoryId, priceCents: price as number, stock: stock as number,
    status: status as "DRAFT" | "ACTIVE" | "ARCHIVED",
    nameEn: str("nameEn", 250) || null,
    descriptionBg: str("descriptionBg", 10000) || null,
    descriptionEn: str("descriptionEn", 10000) || null
  };
}

async function parseBody(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 16000) return null;
  try { const text = await request.text(); return text.length <= 16000 ? JSON.parse(text) as unknown : null; }
  catch { return null; }
}

export async function POST(request: Request) {
  if (!await authorizeAdmin(request)) return unauthorized();
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Базата данни още не е свързана." }, { status: 503 });
  const data = validate(await parseBody(request));
  if (!data) return NextResponse.json({ error: "Проверете полетата на продукта." }, { status: 400 });
  try {
    const product = await prisma.product.create({ data });
    return NextResponse.json({ id: product.id }, { status: 201, headers: noStore });
  } catch { return NextResponse.json({ error: "Неуспешно създаване. Проверете SKU, URL и категорията." }, { status: 409 }); }
}

export async function PATCH(request: Request) {
  if (!await authorizeAdmin(request)) return unauthorized();
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Базата данни още не е свързана." }, { status: 503 });
  const input = await parseBody(request);
  const id = input && typeof input === "object" && "id" in input && typeof input.id === "string" ? input.id : "";
  const data = validate(input);
  if (!id || id.length > 100 || !data) return NextResponse.json({ error: "Невалидни данни." }, { status: 400 });
  try {
    const product = await prisma.product.update({ where: { id }, data });
    return NextResponse.json({ id: product.id }, { headers: noStore });
  } catch { return NextResponse.json({ error: "Неуспешно записване. Проверете SKU, URL и категорията." }, { status: 409 }); }
}
