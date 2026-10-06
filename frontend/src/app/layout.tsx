import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Round One | Interview Studio",
  description: "Adaptive interview training and evidence-based practice feedback.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
