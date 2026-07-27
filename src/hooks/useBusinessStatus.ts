import { useState, useEffect } from 'react'
import { useSettings } from './useSettings'
import { isBusinessOpen, type BusinessStatus } from '@/utils/businessHours'

export function useBusinessStatus() {
  const { settings, loading } = useSettings()
  const [status, setStatus] = useState<BusinessStatus>({
    isOpen: true,
    message: '',
    nextOpenDay: '',
    nextOpenTime: '',
  })

  useEffect(() => {
    if (loading || !settings?.businessHours?.length) return
    const check = () => {
      if (settings.businessHoursEnabled === false) {
        setStatus({ isOpen: true, message: '', nextOpenDay: '', nextOpenTime: '' })
        return
      }
      setStatus(isBusinessOpen(settings.businessHours))
    }
    check()
    const interval = setInterval(check, 60000)
    return () => clearInterval(interval)
  }, [settings, loading])

  return { status, loading }
}
