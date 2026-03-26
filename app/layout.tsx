import './globals.css'

export const metadata = {
  title: 'FluxoPro',
  description: 'Seu financeiro premium',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}