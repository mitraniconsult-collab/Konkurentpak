import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Продуктовият каталог още не е активиран.", configured: false }, { status: 503 });
  }

  const { slug } = await context.params;
  if (!/^[a-z0-9][a-z0-9-]{0,119}$/i.test(slug)) {
    return NextResponse.json({ error: "Невалиден адрес на продукт." }, { status: 400 });
  }

  try {
    const product = await prisma.product.findFirst({
      where: { slug, status: "ACTIVE" },
      select: {
        id: true, slug: true, sku: true, nameBg: true, nameEn: true,
        descriptionBg: true, descriptionEn: true, priceCents: true, currency: true,
        stock: true, categoryId: true,
        category: { select: { slug: true, nameBg: true, nameEn: true } }
      }
    });
    if (!product) return NextResponse.json({ error: "Продуктът не е намерен." }, { status: 404 });

    const related = await prisma.product.findMany({
      where: { status: "ACTIVE", categoryId: product.categoryId, id: { not: product.id } },
      select: { id: true, slug: true, nameBg: true, priceCents: true, currency: true, stock: true },
      orderBy: { nameBg: "asc" }, take: 4
    });

    return NextResponse.json({ product, related }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Продуктът временно не е достъпен." }, { status: 503 });
  }
}
