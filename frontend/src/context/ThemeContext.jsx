import React, { createContext, useContext, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setTheme, setSystemTheme, initializeTheme } from '../store/slices/themeSlice'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const dispatch = useDispatch()
  const { currentTheme, systemTheme, themeSettings } = useSelector(state => state.theme)

  // تهيئة المظهر عند بداية التطبيق
  useEffect(() => {
    dispatch(initializeTheme())
  }, [dispatch])

  // مراقبة تغيير مظهر النظام
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      dispatch(setSystemTheme(e.matches ? 'dark' : 'light'))
    }
    
    mediaQuery.addEventListener('change', handleChange)
    dispatch(setSystemTheme(mediaQuery.matches ? 'dark' : 'light'))
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [dispatch])

  // تطبيق المظهر على HTML
  useEffect(() => {
    const root = document.documentElement
    
    if (currentTheme === 'dark') {
      root.classList.add('dark')
    } else if (currentTheme === 'light') {
      root.classList.remove('dark')
    } else if (currentTheme === 'auto') {
      if (systemTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }, [currentTheme, systemTheme])

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    dispatch(setTheme(newTheme))
  }

  const changeTheme = (theme) => {
    dispatch(setTheme(theme))
  }

  const isDarkMode = currentTheme === 'dark' || 
    (currentTheme === 'auto' && systemTheme === 'dark')

  const value = {
    currentTheme,
    systemTheme,
    themeSettings,
    isDarkMode,
    toggleTheme,
    changeTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider