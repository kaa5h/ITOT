import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './context/AppContext'
import { RequestCreationProvider } from './context/RequestCreationContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <RequestCreationProvider>
          <App />
        </RequestCreationProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
