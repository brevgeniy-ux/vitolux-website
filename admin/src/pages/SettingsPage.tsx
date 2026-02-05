import { useEffect, useState } from 'react'
import { settingsApi, Settings } from '../api/client'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<Settings>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingTelegram, setTestingTelegram] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const res = await settingsApi.getAll()
      setSettings(res.data)
    } catch (error) {
      toast.error('Помилка завантаження налаштувань')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await settingsApi.update(settings)
      toast.success('Налаштування збережено')
    } catch (error) {
      toast.error('Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const handleTestTelegram = async () => {
    setTestingTelegram(true)
    try {
      const res = await settingsApi.testTelegram()
      if (res.data.success) {
        toast.success('Тестове повідомлення надіслано!')
      } else {
        toast.error('Помилка відправки. Перевірте налаштування Telegram.')
      }
    } catch (error) {
      toast.error('Помилка відправки тестового повідомлення')
    } finally {
      setTestingTelegram(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Завантаження...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Налаштування</h1>

      <div className="space-y-6">
        {/* Основные настройки */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Основні налаштування</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold">Назва сайту</label>
              <input
                type="text"
                value={settings.site_name || ''}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Телефон</label>
              <input
                type="text"
                value={settings.site_phone || ''}
                onChange={(e) => setSettings({ ...settings, site_phone: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Email</label>
              <input
                type="email"
                value={settings.site_email || ''}
                onChange={(e) => setSettings({ ...settings, site_email: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
          </div>
        </div>

        {/* Telegram настройки */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Telegram сповіщення</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold">Bot Token</label>
              <input
                type="text"
                value={settings.telegram_bot_token || ''}
                onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                className="w-full border rounded p-2"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              />
              <p className="text-sm text-gray-500 mt-1">
                Отримайте токен у @BotFather в Telegram
              </p>
            </div>
            <div>
              <label className="block mb-2 font-semibold">Chat ID</label>
              <input
                type="text"
                value={settings.telegram_chat_id || ''}
                onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                className="w-full border rounded p-2"
                placeholder="123456789"
              />
              <p className="text-sm text-gray-500 mt-1">
                ID чату куди відправлятити сповіщення
              </p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.telegram_notifications_enabled === 'true'}
                onChange={(e) => setSettings({
                  ...settings,
                  telegram_notifications_enabled: e.target.checked ? 'true' : 'false'
                })}
                className="mr-2"
              />
              <label>Увімкнути сповіщення</label>
            </div>
            <button
              onClick={handleTestTelegram}
              disabled={testingTelegram}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {testingTelegram ? 'Відправка...' : 'Надіслати тестове повідомлення'}
            </button>
          </div>
        </div>

        {/* Настройки доставки */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Доставка</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 font-semibold">Поріг безкоштовної доставки (₴)</label>
              <input
                type="number"
                value={settings.free_delivery_threshold || ''}
                onChange={(e) => setSettings({ ...settings, free_delivery_threshold: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Вартість доставки (₴)</label>
              <input
                type="number"
                value={settings.delivery_cost || ''}
                onChange={(e) => setSettings({ ...settings, delivery_cost: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Збереження...' : 'Зберегти налаштування'}
          </button>
        </div>
      </div>
    </div>
  )
}
