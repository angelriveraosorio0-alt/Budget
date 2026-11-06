import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthyPockets",
  description: "A privacy-first budgeting tool. See where your money goes and plan your savings.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%232563eb'/><path d='M8 12h14v10H8zM8 12l3-3h8' fill='none' stroke='white' stroke-width='2' stroke-linejoin='round'/></svg>",
  },
};

// Applies the saved light/dark choice before the page paints, so there's no flash.
const THEME_SCRIPT = `try{if(localStorage.getItem("hp-theme")==="dark"){document.documentElement.dataset.theme="dark"}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
        {children}
      </body>
    </html>
  );
}
