import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LanguageStore {
  language: 'uk' | 'en'
  setLanguage: (lang: 'uk' | 'en') => void
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'uk',
      setLanguage: (lang) => {
        set({ language: lang })
        localStorage.setItem('i18nextLng', lang)
        window.location.reload()
      },
    }),
    {
      name: 'language-storage',
    }
  )
)
