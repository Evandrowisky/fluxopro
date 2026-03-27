'use client'

import { useState } from 'react'

type Props = {
  phone: string
  message?: string
}

export function WhatsappSupport({
  phone,
  message = 'Olá! Preciso de ajuda com o FluxoPro.',
}: Props) {
  const [open, setOpen] = useState(false)

  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-80 rounded-3xl border border-gray-200 bg-white p-5 shadow-2xl">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Suporte via WhatsApp
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Fale com nosso suporte e tire suas dúvidas rapidamente.
            </p>
          </div>

          <div className="space-y-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-2xl bg-green-500 px-4 py-3 text-center font-medium text-white hover:opacity-90"
            >
              Abrir WhatsApp
            </a>

            <button
              onClick={() => setOpen(false)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-xl transition hover:scale-105 hover:opacity-90"
        aria-label="Abrir suporte no WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="h-8 w-8 fill-current"
        >
          <path d="M19.11 17.21c-.29-.15-1.71-.84-1.97-.94-.26-.1-.45-.15-.64.15-.19.29-.74.94-.91 1.13-.17.19-.33.22-.62.07-.29-.15-1.21-.45-2.3-1.43-.85-.76-1.42-1.7-1.59-1.99-.17-.29-.02-.45.13-.6.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.64-1.54-.88-2.11-.23-.56-.47-.48-.64-.49l-.55-.01c-.19 0-.5.07-.76.36-.26.29-.99.97-.99 2.36 0 1.39 1.01 2.73 1.15 2.92.14.19 1.99 3.04 4.82 4.26.67.29 1.2.46 1.61.59.68.21 1.3.18 1.79.11.55-.08 1.71-.7 1.95-1.37.24-.67.24-1.24.17-1.37-.07-.12-.26-.19-.55-.33z" />
          <path d="M16.01 3.2c-7.05 0-12.79 5.73-12.79 12.77 0 2.23.58 4.4 1.67 6.3L3.1 28.8l6.69-1.75a12.82 12.82 0 0 0 6.22 1.59h.01c7.04 0 12.78-5.73 12.78-12.78 0-3.41-1.33-6.61-3.75-9.02A12.7 12.7 0 0 0 16.01 3.2zm0 23.28h-.01a10.65 10.65 0 0 1-5.42-1.49l-.39-.23-3.97 1.04 1.06-3.87-.25-.4a10.57 10.57 0 0 1-1.63-5.65c0-5.86 4.76-10.62 10.61-10.62 2.83 0 5.48 1.1 7.48 3.1a10.51 10.51 0 0 1 3.11 7.49c0 5.86-4.77 10.63-10.59 10.63z" />
        </svg>
      </button>
    </div>
  )
}