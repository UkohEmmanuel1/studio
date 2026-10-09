import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PosterStudio — Design something worth stopping for",
  description: "Create polished social media posters with a fast, approachable design studio.",
  openGraph: {
    title: "PosterStudio",
    description: "Make your next post impossible to scroll past.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
