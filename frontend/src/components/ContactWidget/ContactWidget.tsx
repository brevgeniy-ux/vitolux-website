import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ContactWidget() {
  const [isOpen, setIsOpen] = useState(false)

  const phone = '+380XXXXXXXXX'
  const whatsapp = '380XXXXXXXXX'
  const telegram = 'username'
  const email = 'info@vitoluxua.com'

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 bg-white rounded-lg shadow-xl p-4 z-50 min-w-[200px]"
          >
            <div className="space-y-3">
              <a
                href={`tel:${phone}`}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded transition"
              >
                <span className="text-2xl">☎️</span>
                <span className="text-gray-700">Позвонить</span>
              </a>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded transition"
              >
                <span className="text-2xl">💬</span>
                <span className="text-gray-700">WhatsApp</span>
              </a>
              <a
                href={`https://t.me/${telegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded transition"
              >
                <span className="text-2xl">✈️</span>
                <span className="text-gray-700">Telegram</span>
              </a>
              <a
                href={`mailto:${email}`}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded transition"
              >
                <span className="text-2xl">✉️</span>
                <span className="text-gray-700">Email</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-primary text-white rounded-full w-14 h-14 shadow-lg hover:bg-primary/90 transition z-50 flex items-center justify-center"
        aria-label="Контакти"
      >
        <span className="text-2xl">💬</span>
      </button>
    </>
  )
}
