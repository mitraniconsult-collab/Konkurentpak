"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
type Product={id:string;slug:string;sku:string;nameBg:string;priceCents:number;currency:string;stock:number;category:{slug:string;nameBg:string}};
const categories=["Всички","Стандартни кашони","Щанцовани опаковки","Каширани опаковки"];
export default function Catalog(){
 const [q,setQ]=useState("");const [category,setCategory]=useState("Всички");
 const [items,setItems]=useState<Product[]>([]);const [loading,setLoading]=useState(true);const [configured,setConfigured]=useState(false);const [error,setError]=useState("");
 useEffect(()=>{const controller=new AbortController();const timer=setTimeout(async()=>{
 setLoading(true);setError("");
 try{const params=new URLSearchParams();if(q.trim())params.set("q",q.trim());const res=await fetch("/api/products?"+params.toString(),{signal:controller.signal,cache:"no-store"});const data=await res.json() as {products?:Product[];configured?:boolean;error?:string};if(res.status===503&&data.configured===false){setConfigured(false);setItems([]);}else if(!res.ok){setError(data.error||"Каталогът не е достъпен.");setItems([]);}else{setConfigured(true);setItems(data.products||[]);}}
 catch(e){if(!controller.signal.aborted){setError("Възникна грешка при зареждането.");setItems([]);}}
 finally{if(!controller.signal.aborted)setLoading(false);}
 },250);return()=>{controller.abort();clearTimeout(timer)};},[q]);
 const visible=category==="Всички"?items:items.filter(p=>p.category.nameBg===category);
 return <section aria-label="Продуктов каталог">
 <div className="card"><label htmlFor="catalog-search">Търсене на продукт</label><input id="catalog-search" type="search" placeholder="Наименование или вид опаковка" value={q} onChange={e=>setQ(e.target.value)}/>
 <label htmlFor="catalog-category">Категория</label><select id="catalog-category" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x} value={x}>{x}</option>)}</select></div>
 {loading?<p role="status">Зареждане на каталога...</p>:error?<p role="alert">{error}</p>:!configured?<div className="card" style={{marginTop:24}}><h2>Каталогът се подготвя</h2><p>Продуктите, цените и наличностите ще се появят след свързването на базата данни. Междувременно можете да заявите индивидуална оферта.</p><Link className="btn" href="/custom-packaging">Индивидуална оферта</Link></div>:visible.length===0?<p role="status">Няма намерени продукти. Опитайте друго търсене или категория.</p>:<div className="grid">{visible.map(p=><article className="card" key={p.id}><p style={{fontSize:13}}>SKU: {p.sku} · {p.category.nameBg}</p><h2>{p.nameBg}</h2><p><strong>{new Intl.NumberFormat("bg-BG",{style:"currency",currency:p.currency}).format(p.priceCents/100)}</strong></p><p>{p.stock>0?"Налично":"По заявка"}</p><Link href={"/products/"+encodeURIComponent(p.slug)} className="btn">Детайли</Link></article>)}</div>}
 </section>;
}
