import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { Toaster } from 'react-hot-toast'

import App from './App.jsx'
import { store } from './store/store.js'
import { SocketProvider } from './context/SocketContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import './index.css'

// إعداد React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 دقائق
    },
  },
})

// إعداد الإشعارات
const toastOptions = {
  duration: 4000,
  position: 'top-center',
  style: {
    fontFamily: 'Cairo, sans-serif',
    fontSize: '14px',
    borderRadius: '12px',
    padding: '12px 16px',
  },
  success: {
    style: {
      background: '#10b981',
      color: '#ffffff',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#10b981',
    },
  },
  error: {
    style: {
      background: '#ef4444',
      color: '#ffffff',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#ef4444',
    },
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <SocketProvider>
              <App />
              <Toaster 
                toastOptions={toastOptions}
                containerStyle={{
                  zIndex: 9999
                }}
              />
            </SocketProvider>
          </ThemeProvider>
        </BrowserRouter>
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
)