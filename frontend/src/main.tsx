import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux' // Importar Provider
import { store } from './app/store' // Importar la store de Redux
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}> {/* Envolver App con Provider */}
      <App />
    </Provider>
  </StrictMode>,
)
