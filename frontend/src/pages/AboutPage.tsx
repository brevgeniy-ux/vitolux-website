import { useEffect, useState } from 'react'
import { pagesApi } from '../api/pages'

export default function AboutPage() {
  const [content, setContent] = useState<string>('')

  useEffect(() => {
    pagesApi.getBySlug('pro-kompaniyu').then(res => {
      const locale = localStorage.getItem('i18nextLng') || 'uk'
      setContent(locale === 'uk' ? res.data.content_uk : res.data.content_en)
    }).catch(() => {
      setContent('<h1>Про компанію VitoluxUA</h1><p>Ми пропонуємо широкий вибір електрообладнання від провідних виробників.</p>')
    })
  }, [])

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto prose" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}
