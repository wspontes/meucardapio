import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pass = ''
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pass
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { uid, password } = req.body || {}
  if (!uid) {
    return res.status(400).json({ error: 'uid is required' })
  }

  let newPassword = password
  if (newPassword) {
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' })
    }
  } else {
    newPassword = generatePassword()
  }

  try {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64
    if (!b64) {
      return res.status(500).json({ error: 'Service account not configured' })
    }

    const json = Buffer.from(b64, 'base64').toString('utf-8')
    const sa = JSON.parse(json)

    if (getApps().length === 0) {
      initializeApp({
        credential: cert(sa),
        projectId: sa.project_id,
      })
    }

    await getAuth().updateUser(uid, { password: newPassword })
    return res.status(200).json({ password: newPassword })
  } catch (err) {
    console.error('Reset password error:', err)
    return res.status(500).json({ error: err.message || 'Internal error' })
  }
}
