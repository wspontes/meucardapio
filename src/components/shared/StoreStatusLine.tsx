import { useEffect, useState } from 'react'
import { useSettings } from '@/hooks'
import { getStoreStatus, type StoreStatus } from '@/utils/storeStatus'

export function StoreStatusLine() {
  const { settings, loading } = useSettings()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  if (loading || !settings?.businessHours?.length) return null

  let status: StoreStatus
  if (settings.businessHoursEnabled === false) {
    status = { isOpen: true, label: 'Aberto agora', nextChange: null }
  } else {
    status = getStoreStatus(settings.businessHours, now)
  }

  if (!status.label) return null

  const dotColor = status.isOpen ? 'var(--status-open)' : 'var(--status-closed)'

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center">
      <span
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
        style={{
          backgroundColor: dotColor,
          boxShadow: `0 0 6px ${dotColor}`,
        }}
        aria-hidden="true"
      />
      <span
        className="text-[15px] font-medium"
        style={{
          color: 'var(--status-text)',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
        }}
      >
        {status.label}
      </span>
    </div>
  )
}
