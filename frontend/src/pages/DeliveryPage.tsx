import { useEffect, useState } from 'react'
import { pagesApi } from '../api/pages'

export default function DeliveryPage() {
  const [content, setContent] = useState<string>('')

  useEffect(() => {
    pagesApi.getBySlug('dostavka-ta-oplata').then(res => {
      const locale = localStorage.getItem('i18nextLng') || 'uk'
      setContent(locale === 'uk' ? res.data.content_uk : res.data.content_en)
    }).catch(() => {
      setContent('<h1>Доставка та оплата</h1><p>Доставка по всій Україні.</p>')
    })
  }, [])

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto prose" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}
