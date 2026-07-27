import { doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore'
import { db } from '@/firebase/config'

const SESSION_KEY = 'meucardapio_visited'

export interface AnalyticsData {
  totalVisits: number
  monthlyVisits: number
  todayVisits: number
  currentMonth: string
  currentDay: string
}

export async function trackVisit(): Promise<void> {
  if (sessionStorage.getItem(SESSION_KEY)) return
  sessionStorage.setItem(SESSION_KEY, '1')

  try {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const currentDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const docRef = doc(db, 'analytics', 'visitors')
    const snap = await getDoc(docRef)

    if (!snap.exists()) {
      await setDoc(docRef, {
        totalVisits: 1,
        monthlyVisits: 1,
        todayVisits: 1,
        currentMonth,
        currentDay,
      })
      return
    }

    const data = snap.data()
    const updates: Record<string, unknown> = { totalVisits: increment(1) }

    if (data.currentMonth !== currentMonth) {
      updates.monthlyVisits = 1
      updates.currentMonth = currentMonth
    } else {
      updates.monthlyVisits = increment(1)
    }

    if (data.currentDay !== currentDay) {
      updates.todayVisits = 1
      updates.currentDay = currentDay
    } else {
      updates.todayVisits = increment(1)
    }

    await updateDoc(docRef, updates)
  } catch {
    // Analytics é best-effort
  }
}

export async function getAnalytics(): Promise<AnalyticsData> {
  try {
    const docRef = doc(db, 'analytics', 'visitors')
    const snap = await getDoc(docRef)
    if (!snap.exists()) return { totalVisits: 0, monthlyVisits: 0, todayVisits: 0, currentMonth: '', currentDay: '' }
    const data = snap.data()
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const currentDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    return {
      totalVisits: data.totalVisits || 0,
      monthlyVisits: data.currentMonth === currentMonth ? (data.monthlyVisits || 0) : 0,
      todayVisits: data.currentDay === currentDay ? (data.todayVisits || 0) : 0,
      currentMonth,
      currentDay,
    }
  } catch {
    return { totalVisits: 0, monthlyVisits: 0, todayVisits: 0, currentMonth: '', currentDay: '' }
  }
}
