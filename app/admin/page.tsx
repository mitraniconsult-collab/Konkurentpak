"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Category = { id: string; nameBg: string; slug: string };
type Product = { id: string; sku: string; slug: string; nameBg: string; nameEn: string | null; descriptionBg: string | null; descriptionEn: string | null; priceCents: number; stock: number; status: "DRAFT" | "ACTIVE" | "ARCHIVED"; categoryId: string };
type FormProduct = Omit<Product, "id"> & { id?: string };

const empty: FormProduct = { sku: "", slug: "", nameBg: "", nameEn: "", descriptionBg: "", descriptionEn: "", priceCents: 0, stock: 0, status: "DRAFT", categoryId: "" };
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export default function AdminPage() {
  const client = useMemo<SupabaseClient | null>(() => url && key ? createClient(url, key) : null, []);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [q, setQ] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormProduct | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!client) return;
    client.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? ""));
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => setToken(session?.access_token ?? ""));
    return () => listener.subscription.unsubscribe();
  }, [client]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`/api/admin/catalog?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Грешка при зареждане.");
      setProducts(data.products); setCategories(data.categories); setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Неуспешно зареждане."); }
  }, [q, token]);

  useEffect(() => { void load(); }, [load]);

  async function login(event: React.FormEvent) {
    event.preventDefault(); if (!client) return;
    setBusy(true); setMessage("");
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) setMessage("Неуспешен вход. Проверете данните и правата за достъп.");
    setBusy(false); setPassword("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!form || !token) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/catalog", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Записът е неуспешен.");
      setForm(null); await load(); setMessage("Продуктът е записан успешно.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Записът е неуспешен."); }
    finally { setBusy(false); }
  }

  const update = (changes: Partial<FormProduct>) => setForm(current => current ? { ...current, ...changes } : null);

  return <main className="admin">
    <style>{`
      .admin{font:15px/1.5 Arial,sans-serif;background:#f2f5f4;color:#253f40;min-height:100vh;padding:32px max(20px,calc((100vw - 1180px)/2))}
      .admin h1{font-size:34px;letter-spacing:-1px;margin:0}.admin h2{font-size:23px;margin:0 0 16px}
      .admin .muted{color:#637271}.admin .panel{background:white;border:1px solid #d9e2de;border-radius:12px;padding:24px;margin-top:22px}
      .admin input,.admin select,.admin textarea{width:100%;border:1px solid #bdcbc7;border-radius:7px;padding:11px;font:inherit;background:white;color:#253f40}
      .admin label{display:block;font-weight:600;margin:0 0 12px}.admin label input,.admin label select,.admin label textarea{margin-top:5px}
      .admin button{border:0;border-radius:7px;background:#245253;color:white;padding:11px 17px;font:inherit;font-weight:600;cursor:pointer}
      .admin button.secondary{background:#e2eae7;color:#245253}.admin button:disabled{opacity:.5;cursor:wait}
      .admin .toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
      .admin table{width:100%;border-collapse:collapse;text-align:left}.admin th,.admin td{padding:12px;border-bottom:1px solid #e2eae7}
      .admin .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      .admin .status{display:inline-block;padding:3px 8px;border-radius:5px;background:#e2eae7;font-size:12px}
      .admin .notice{padding:12px;background:#fff0d6;border-radius:7px;margin-top:15px}
      @media(max-width:700px){.admin{padding:20px 12px}.admin .grid{grid-template-columns:1fr}.admin .panel{padding:15px}.admin .table-wrap{overflow-x:auto}}
    `}</style>
    <div className="toolbar"><div><h1>Конкурент Пак</h1><div className="muted">Управление на продуктовия каталог</div></div><a href="/" style={{color:"#245253"}}>Към магазина ↗</a></div>
    {!client ? <section className="panel"><h2>Предстои свързване</h2><p>Администрацията ще стане достъпна след конфигуриране на Supabase Auth и базата данни.</p></section>
    : !token ? <section className="panel" style={{maxWidth:440}}><h2>Вход за служители</h2><form onSubmit={login}>
      <label>Имейл<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
      <label>Парола<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <button disabled={busy}>Вход</button></form></section>
    : <>
      <section className="panel"><div className="toolbar"><h2>Продукти</h2><div className="toolbar"><input aria-label="Търсене" placeholder="Търси по име или SKU" value={q} onChange={e=>setQ(e.target.value)}/><button onClick={()=>setForm({...empty,categoryId:categories[0]?.id??""})}>+ Нов продукт</button><button className="secondary" onClick={()=>void client.auth.signOut()}>Изход</button></div></div>
        <div className="table-wrap"><table><thead><tr><th>SKU</th><th>Продукт</th><th>Цена</th><th>Наличност</th><th>Статус</th><th></th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td>{p.sku}</td><td>{p.nameBg}</td><td>{(p.priceCents/100).toFixed(2)} €</td><td>{p.stock}</td><td><span className="status">{p.status}</span></td><td><button className="secondary" onClick={()=>setForm({...p})}>Редакция</button></td></tr>)}</tbody></table></div>
        <p className="muted">Показват се до 100 последно редактирани продукта. Новите продукти по подразбиране са чернови.</p>
      </section>
      {form && <section className="panel"><div className="toolbar"><h2>{form.id?"Редакция":"Нов продукт"}</h2><button className="secondary" onClick={()=>setForm(null)}>Затвори</button></div>
        <form onSubmit={save}><div className="grid">
          <label>SKU<input required maxLength={80} value={form.sku} onChange={e=>update({sku:e.target.value})}/></label>
          <label>URL адрес (slug)<input required pattern="[a-zA-Z0-9][a-zA-Z0-9-]*" value={form.slug} onChange={e=>update({slug:e.target.value})}/></label>
          <label>Име на български<input required value={form.nameBg} onChange={e=>update({nameBg:e.target.value})}/></label>
          <label>Име на английски<input value={form.nameEn??""} onChange={e=>update({nameEn:e.target.value})}/></label>
          <label>Категория<select required value={form.categoryId} onChange={e=>update({categoryId:e.target.value})}><option value="">Изберете</option>{categories.map(c=><option value={c.id} key={c.id}>{c.nameBg}</option>)}</select></label>
          <label>Статус<select value={form.status} onChange={e=>update({status:e.target.value as FormProduct["status"]})}><option value="DRAFT">Чернова</option><option value="ACTIVE">Активен</option><option value="ARCHIVED">Архивиран</option></select></label>
          <label>Цена (€)<input type="number" min="0" max="1000000" step="0.01" required value={(form.priceCents/100).toFixed(2)} onChange={e=>update({priceCents:Math.round(Number(e.target.value)*100)})}/></label>
          <label>Наличност<input type="number" min="0" max="10000000" step="1" required value={form.stock} onChange={e=>update({stock:Number(e.target.value)})}/></label>
          <label>Описание на български<textarea rows={5} value={form.descriptionBg??""} onChange={e=>update({descriptionBg:e.target.value})}/></label>
          <label>Описание на английски<textarea rows={5} value={form.descriptionEn??""} onChange={e=>update({descriptionEn:e.target.value})}/></label>
        </div><button disabled={busy}>{busy?"Записване…":"Запази продукта"}</button></form>
      </section>}
    </>}
    {message && <div className="notice" role="status">{message}</div>}
  </main>;
}
