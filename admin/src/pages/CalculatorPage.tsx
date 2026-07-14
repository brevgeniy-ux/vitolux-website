import { useMemo, useState } from 'react'

const DEFAULT_BASE_RATE = 150 // € за годину, перші години
const DEFAULT_EXTRA_RATE = 120 // € за кожну наступну годину
const DEFAULT_MIN_HOURS = 3 // мінімальний час оренди

type DiscountType = 'percent' | 'fixed'

function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

function formatMoney(value: number): string {
  return `${(Math.round(value * 100) / 100).toLocaleString('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} год ${m} хв` : `${h} год`
}

export default function CalculatorPage() {
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('13:00')
  const [baseRate, setBaseRate] = useState(DEFAULT_BASE_RATE)
  const [extraRate, setExtraRate] = useState(DEFAULT_EXTRA_RATE)
  const [minHours, setMinHours] = useState(DEFAULT_MIN_HOURS)
  const [discountType, setDiscountType] = useState<DiscountType>('percent')
  const [discountValue, setDiscountValue] = useState(0)

  const result = useMemo(() => {
    const start = parseTime(startTime)
    const end = parseTime(endTime)
    if (start === null || end === null) return null

    // Якщо кінець раніше початку — прогулянка через північ
    let durationMinutes = end - start
    if (durationMinutes <= 0) durationMinutes += 24 * 60

    const minMinutes = minHours * 60
    const belowMinimum = durationMinutes < minMinutes
    const billedMinutes = Math.max(durationMinutes, minMinutes)

    const baseMinutes = Math.min(billedMinutes, minMinutes)
    const extraMinutes = billedMinutes - baseMinutes

    const baseCost = (baseMinutes / 60) * baseRate
    const extraCost = (extraMinutes / 60) * extraRate
    const subtotal = baseCost + extraCost

    const discount =
      discountType === 'percent'
        ? subtotal * (Math.min(Math.max(discountValue, 0), 100) / 100)
        : Math.min(Math.max(discountValue, 0), subtotal)

    const total = subtotal - discount

    return {
      durationMinutes,
      billedMinutes,
      belowMinimum,
      baseMinutes,
      extraMinutes,
      baseCost,
      extraCost,
      subtotal,
      discount,
      total,
    }
  }, [startTime, endTime, baseRate, extraRate, minHours, discountType, discountValue])

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Калькулятор оренди яхти</h1>

      <div className="space-y-6">
        {/* Время прогулки */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Час прогулянки</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-semibold">З котрої години</label>
              <input
                type="time"
                value={startTime}
                step={1800}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border rounded p-2 text-lg"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">До котрої години</label>
              <input
                type="time"
                value={endTime}
                step={1800}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border rounded p-2 text-lg"
              />
            </div>
          </div>
          {result && (
            <p className="mt-3 text-gray-600">
              Тривалість: <span className="font-semibold">{formatDuration(result.durationMinutes)}</span>
              {result.belowMinimum && (
                <span className="ml-2 text-amber-600 font-semibold">
                  (менше мінімуму — рахуємо як {minHours} год)
                </span>
              )}
            </p>
          )}
        </div>

        {/* Тарифы */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Тариф</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 font-semibold">Перші години (€/год)</label>
              <input
                type="number"
                min={0}
                value={baseRate}
                onChange={(e) => setBaseRate(Number(e.target.value) || 0)}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Наступні години (€/год)</label>
              <input
                type="number"
                min={0}
                value={extraRate}
                onChange={(e) => setExtraRate(Number(e.target.value) || 0)}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Мінімум (год)</label>
              <input
                type="number"
                min={1}
                value={minHours}
                onChange={(e) => setMinHours(Math.max(1, Number(e.target.value) || 1))}
                className="w-full border rounded p-2"
              />
            </div>
          </div>
        </div>

        {/* Скидка */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Знижка на загальний чек</h2>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={0}
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
              className="w-32 border rounded p-2 text-lg"
            />
            <div className="flex rounded overflow-hidden border">
              <button
                onClick={() => setDiscountType('percent')}
                className={`px-4 py-2 ${discountType === 'percent' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                %
              </button>
              <button
                onClick={() => setDiscountType('fixed')}
                className={`px-4 py-2 ${discountType === 'fixed' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                €
              </button>
            </div>
            {discountValue > 0 && (
              <button
                onClick={() => setDiscountValue(0)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                скинути
              </button>
            )}
          </div>
        </div>

        {/* Итог */}
        {result ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Розрахунок</h2>
            <div className="space-y-2 text-lg">
              <div className="flex justify-between">
                <span>
                  Перші {formatDuration(result.baseMinutes)} × {baseRate} €/год
                </span>
                <span className="font-semibold">{formatMoney(result.baseCost)}</span>
              </div>
              {result.extraMinutes > 0 && (
                <div className="flex justify-between">
                  <span>
                    Додатково {formatDuration(result.extraMinutes)} × {extraRate} €/год
                  </span>
                  <span className="font-semibold">{formatMoney(result.extraCost)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span>Разом</span>
                <span className="font-semibold">{formatMoney(result.subtotal)}</span>
              </div>
              {result.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    Знижка{discountType === 'percent' ? ` ${discountValue}%` : ''}
                  </span>
                  <span className="font-semibold">−{formatMoney(result.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3 text-2xl font-bold">
                <span>До сплати</span>
                <span className="text-primary">{formatMoney(result.total)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-gray-500">
            Вкажіть коректний час початку та завершення прогулянки
          </div>
        )}
      </div>
    </div>
  )
}
