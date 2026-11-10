import Link from "next/link";
import {notFound} from "next/navigation";
import {prisma} from "../../../lib/prisma";
export const dynamic="force-dynamic";
type Props={params:Promise<{slug:string}>};
export default async function ProductPage({params}:Props){
 const {slug}=await params;
 if(!process.env.DATABASE_URL)notFound();
 const product=await prisma.product.findFirst({where:{slug,status:"ACTIVE"},include:{category:true}}).catch(()=>null);
 if(!product)notFound();
 const related=await prisma.product.findMany({where:{status:"ACTIVE",categoryId:product.categoryId,id:{not:product.id}},take:4,orderBy:{nameBg:"asc"}}).catch(()=>[]);
 return <><nav aria-label="Път до продукта"><Link href="/">Начало</Link> / <Link href="/products">Продукти</Link> / {product.nameBg}</nav>
 <h1>{product.nameBg}</h1><div className="card"><p>Категория: {product.category.nameBg} · SKU: {product.sku}</p><h2>{new Intl.NumberFormat("bg-BG",{style:"currency",currency:product.currency}).format(product.priceCents/100)}</h2><p>{product.stock>0?"Налично":"По заявка"}</p>{product.descriptionBg&&<p>{product.descriptionBg}</p>}<p>Онлайн поръчките ще бъдат активирани след свързване на платежната система.</p><Link href="/contact" className="btn">Попитайте за продукта</Link></div>
 {related.length>0&&<section><h2>Свързани продукти</h2><div className="grid">{related.map(p=><article className="card" key={p.id}><h3>{p.nameBg}</h3><Link href={"/products/"+encodeURIComponent(p.slug)}>Виж продукта</Link></article>)}</div></section>}
 </>;
}
export async function generateMetadata({params}:Props){const {slug}=await params;if(!process.env.DATABASE_URL)return {title:"Продукт"};const p=await prisma.product.findFirst({where:{slug,status:"ACTIVE"},select:{nameBg:true,descriptionBg:true}}).catch(()=>null);return {title:p?.nameBg||"Продукт",description:p?.descriptionBg?.slice(0,155)||"Опаковки от велпапе — Конкурент Пак"};}
