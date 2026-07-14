import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import './ui/stilar.css'

createRoot(document.getElementById('rot')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
