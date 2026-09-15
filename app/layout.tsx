import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://family-tree-black-one.vercel.app"),
  title: "שבט יעקב - עץ המשפחה שלנו",
  description: "עץ משפחה אינטראקטיבי",
  openGraph: {
    title: "שבט יעקב - עץ המשפחה שלנו",
    description: "עץ משפחה אינטראקטיבי",
    siteName: "שבט יעקב",
    locale: "he_IL",
    type: "website",
  },
};

const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("family-tree-theme");if(t&&t!=="light")document.documentElement.setAttribute("data-theme",t);}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The inline theme script below sets data-theme before React hydrates
      // (to avoid a flash of the wrong theme), which will always differ from
      // the server-rendered <html> — that mismatch is expected, not a bug.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
