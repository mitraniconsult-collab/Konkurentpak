import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = {title:{default:"Конкурент Пак | Опаковки от велпапе",template:"%s | Конкурент Пак"},description:"Кашони и индивидуални решения за опаковане от велпапе."};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="bg"><body><header className="header"><Link className="brand" href="/">КОНКУРЕНТ ПАК</Link><nav><Link href="/products">Продукти</Link><Link href="/custom-packaging">Индивидуална опаковка</Link><Link href="/contact">Контакти</Link></nav></header><main>{children}</main><footer>© {new Date().getFullYear()} Конкурент Пак · <Link href="/privacy">Поверителност</Link></footer></body></html>}
