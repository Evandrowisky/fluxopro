import './globals.css'
import { WhatsappSupport } from '../components/WhatsappSupport'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <WhatsappSupport
          phone="5512997383529"
          message="Olá! Preciso de ajuda com o FluxoPro."
        />
      </body>
    </html>
  )
}