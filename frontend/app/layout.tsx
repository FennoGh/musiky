import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/header/Header";

export const metadata: Metadata = {
  title: "Musiky - Colabora, distribuye y cobra sin dramas",
  description: "La plataforma donde los equipos musicales gestionan proyectos, distribuyen su música y cobran automáticamente. Sin Excel, sin perseguir a nadie.",
  openGraph: {
    title: "Musiky - Colabora, distribuye y cobra sin dramas",
    description: "La plataforma donde los equipos musicales gestionan proyectos, distribuyen su música y cobran automáticamente.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700&family=Inter:wght@400;500;600;700&family=Newsreader:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
