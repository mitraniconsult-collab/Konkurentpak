"use client";
import { FormEvent, useState } from "react";

type Fields = {customerName:string;email:string;phone:string;company:string;lengthMm:string;widthMm:string;heightMm:string;quantity:string;material:string;notes:string;website:string};
const initial: Fields = {customerName:"",email:"",phone:"",company:"",lengthMm:"",widthMm:"",heightMm:"",quantity:"",material:"",notes:"",website:""};
export default function QuoteForm() {
  const [fields,setFields]=useState<Fields>(initial);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [success,setSuccess]=useState(false);
  const set=(key:keyof Fields,value:string)=>setFields(prev=>({...prev,[key]:value}));
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage(""); setSuccess(false);
    const payload={...fields,lengthMm:Number(fields.lengthMm),widthMm:Number(fields.widthMm),heightMm:Number(fields.heightMm),quantity:Number(fields.quantity)};
    try {
      const response=await fetch("/api/quotes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await response.json() as {error?:string;reference?:string};
      if(!response.ok){setMessage(data.error||"Неуспешно изпращане. Моля, опитайте отново.");return;}
      setSuccess(true);setMessage("Запитването е прието. Референтен номер: "+(data.reference||"—"));setFields(initial);
    } catch {setMessage("Възникна проблем с връзката. Моля, опитайте по-късно.");}
    finally {setBusy(false);}
  }
  return <form onSubmit={submit} className="card" aria-label="Запитване за индивидуална опаковка">
    <h2>Заявете индивидуална оферта</h2>
    <p>Посочете вътрешните размери в милиметри и желания тираж. Полетата със * са задължителни.</p>
    <div className="grid">
      <div><label htmlFor="quote-name">Име и фамилия *</label><input id="quote-name" required minLength={2} maxLength={120} autoComplete="name" value={fields.customerName} onChange={e=>set("customerName",e.target.value)}/></div>
      <div><label htmlFor="quote-email">Имейл *</label><input id="quote-email" type="email" required maxLength={254} autoComplete="email" value={fields.email} onChange={e=>set("email",e.target.value)}/></div>
      <div><label htmlFor="quote-phone">Телефон</label><input id="quote-phone" type="tel" maxLength={50} autoComplete="tel" value={fields.phone} onChange={e=>set("phone",e.target.value)}/></div>
      <div><label htmlFor="quote-company">Фирма</label><input id="quote-company" maxLength={120} autoComplete="organization" value={fields.company} onChange={e=>set("company",e.target.value)}/></div>
      {(["lengthMm","widthMm","heightMm"] as const).map((key,i)=><div key={key}><label htmlFor={key}>{["Дължина","Ширина","Височина"][i]} (мм) *</label><input id={key} type="number" required min={1} max={10000} step={1} value={fields[key]} onChange={e=>set(key,e.target.value)}/></div>)}
      <div><label htmlFor="quote-quantity">Количество (бр.) *</label><input id="quote-quantity" type="number" required min={1} max={1000000} step={1} value={fields.quantity} onChange={e=>set("quantity",e.target.value)}/></div>
    </div>
    <label htmlFor="quote-material">Материал</label><select id="quote-material" value={fields.material} onChange={e=>set("material",e.target.value)}><option value="">Не съм сигурен / консултация</option><option value="Трислойно велпапе">Трислойно велпапе</option><option value="Петслойно велпапе">Петслойно велпапе</option><option value="Картон">Картон</option><option value="Друг">Друг</option></select>
    <label htmlFor="quote-notes">Допълнителни изисквания</label><textarea id="quote-notes" maxLength={2000} placeholder="Предназначение, печат, желан срок и други подробности" value={fields.notes} onChange={e=>set("notes",e.target.value)}/>
    <div style={{position:"absolute",left:"-9999px"}} aria-hidden="true"><label htmlFor="quote-website">Уебсайт</label><input id="quote-website" tabIndex={-1} autoComplete="off" value={fields.website} onChange={e=>set("website",e.target.value)}/></div>
    <p style={{fontSize:13}}>С изпращането предоставяте данните си за обработка на запитването съгласно политиката за поверителност.</p>
    <button disabled={busy} type="submit">{busy?"Изпращане...":"Изпрати запитване"}</button>
    {message&&<p role="status" style={{color:success?"#17613d":"#a12c2c",fontWeight:600}}>{message}</p>}
  </form>;
}
