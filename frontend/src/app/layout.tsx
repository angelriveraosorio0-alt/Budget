import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthyPockets",
  description: "A privacy-first budgeting tool. See where your money goes and plan your savings.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🥑</text></svg>",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
