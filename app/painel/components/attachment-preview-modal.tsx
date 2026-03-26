'use client'

type AttachmentPreviewModalProps = {
  open: boolean
  onClose: () => void
  url: string | null
}

function isImage(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url)
}

export function AttachmentPreviewModal({
  open,
  onClose,
  url,
}: AttachmentPreviewModalProps) {
  if (!open || !url) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Comprovante</h3>
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>

        {isImage(url) ? (
          <img
            src={url}
            alt="Comprovante"
            className="max-h-[75vh] w-full rounded-2xl object-contain"
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              O comprovante não é uma imagem. Abra em nova aba:
            </p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-xl bg-black px-4 py-3 text-sm text-white"
            >
              Abrir comprovante
            </a>
          </div>
        )}
      </div>
    </div>
  )
}