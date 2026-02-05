import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await apiClient.get('/admin/settings')
      const settingsMap: any = {}
      res.data.forEach((s: any) => {
        settingsMap[s.key] = s.value
      })
      setSettings(settingsMap)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await apiClient.put('/admin/settings', { settings })
      toast.success('Налаштування збережено')
    } catch (error) {
      toast.error('Помилка збереження')
    }
  }

  if (loading) {
    return <div>Завантаження...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Налаштування</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block mb-2 font-semibold">Назва сайту (UA)</label>
          <input
            type="text"
            value={settings.site_name_uk || ''}
            onChange={(e) => setSettings({ ...settings, site_name_uk: e.target.value })}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Телефон</label>
          <input
            type="text"
            value={settings.contact_phone || ''}
            onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Email</label>
          <input
            type="email"
            value={settings.contact_email || ''}
            onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
            className="w-full border rounded p-2"
          />
        </div>

        <button
          onClick={handleSave}
          className="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90"
        >
          Зберегти
        </button>
      </div>
    </div>
  )
}
