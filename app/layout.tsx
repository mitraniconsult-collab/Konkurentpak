import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Конкурент Пак — Администрация",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="bg"><body style={{ margin: 0 }}>{children}</body></html>;
}
