import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { hideAppSplash } from './utils/splash'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Segurança: nunca deixa a tela de entrada presa se o tema não carregar.
window.setTimeout(hideAppSplash, 2500)
