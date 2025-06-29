import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentTheme: 'light', // light, dark, auto
  systemTheme: 'light',
  themeSettings: {
    primaryColor: 'blue',
    accentColor: 'purple',
    borderRadius: 'medium', // small, medium, large
    animations: true,
    reducedMotion: false,
    fontSize: 'medium', // small, medium, large
    compactMode: false,
  },
  customThemes: [],
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.currentTheme = action.payload
      
      // تطبيق المظهر على DOM
      const root = document.documentElement
      if (action.payload === 'dark') {
        root.classList.add('dark')
      } else if (action.payload === 'light') {
        root.classList.remove('dark')
      } else if (action.payload === 'auto') {
        // استخدام إعداد النظام
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
      
      // حفظ في localStorage
      localStorage.setItem('theme', action.payload)
    },
    
    setSystemTheme: (state, action) => {
      state.systemTheme = action.payload
      
      // إذا كان المظهر على auto، طبق المظهر الجديد
      if (state.currentTheme === 'auto') {
        const root = document.documentElement
        if (action.payload === 'dark') {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
    },
    
    updateThemeSettings: (state, action) => {
      state.themeSettings = {
        ...state.themeSettings,
        ...action.payload
      }
      
      // تطبيق الإعدادات على CSS
      const root = document.documentElement
      
      // تطبيق اللون الأساسي
      if (action.payload.primaryColor) {
        root.style.setProperty('--primary-color', `var(--${action.payload.primaryColor}-500)`)
      }
      
      // تطبيق اللون الثانوي
      if (action.payload.accentColor) {
        root.style.setProperty('--accent-color', `var(--${action.payload.accentColor}-500)`)
      }
      
      // تطبيق نصف القطر
      if (action.payload.borderRadius) {
        const radiusMap = {
          small: '4px',
          medium: '8px',
          large: '12px'
        }
        root.style.setProperty('--border-radius', radiusMap[action.payload.borderRadius])
      }
      
      // تطبيق حجم الخط
      if (action.payload.fontSize) {
        const fontSizeMap = {
          small: '14px',
          medium: '16px',
          large: '18px'
        }
        root.style.setProperty('--base-font-size', fontSizeMap[action.payload.fontSize])
      }
      
      // تطبيق إعدادات الحركة
      if (action.payload.animations !== undefined) {
        root.style.setProperty('--animations-enabled', action.payload.animations ? '1' : '0')
      }
      
      if (action.payload.reducedMotion !== undefined) {
        root.style.setProperty('--reduced-motion', action.payload.reducedMotion ? '1' : '0')
      }
      
      // الوضع المضغوط
      if (action.payload.compactMode !== undefined) {
        root.classList.toggle('compact-mode', action.payload.compactMode)
      }
      
      // حفظ الإعدادات
      localStorage.setItem('themeSettings', JSON.stringify(state.themeSettings))
    },
    
    addCustomTheme: (state, action) => {
      const newTheme = {
        id: Date.now().toString(),
        name: action.payload.name,
        colors: action.payload.colors,
        settings: action.payload.settings,
        createdAt: new Date().toISOString()
      }
      state.customThemes.push(newTheme)
      localStorage.setItem('customThemes', JSON.stringify(state.customThemes))
    },
    
    removeCustomTheme: (state, action) => {
      state.customThemes = state.customThemes.filter(theme => theme.id !== action.payload)
      localStorage.setItem('customThemes', JSON.stringify(state.customThemes))
    },
    
    applyCustomTheme: (state, action) => {
      const theme = state.customThemes.find(t => t.id === action.payload)
      if (theme) {
        state.themeSettings = { ...state.themeSettings, ...theme.settings }
        
        // تطبيق الألوان المخصصة
        const root = document.documentElement
        Object.entries(theme.colors).forEach(([key, value]) => {
          root.style.setProperty(`--custom-${key}`, value)
        })
      }
    },
    
    resetThemeSettings: (state) => {
      state.themeSettings = initialState.themeSettings
      state.currentTheme = 'light'
      
      // إعادة تعيين CSS
      const root = document.documentElement
      root.classList.remove('dark', 'compact-mode')
      root.style.removeProperty('--primary-color')
      root.style.removeProperty('--accent-color')
      root.style.removeProperty('--border-radius')
      root.style.removeProperty('--base-font-size')
      root.style.removeProperty('--animations-enabled')
      root.style.removeProperty('--reduced-motion')
      
      // حذف من localStorage
      localStorage.removeItem('theme')
      localStorage.removeItem('themeSettings')
    },
    
    initializeTheme: (state) => {
      // تحميل الإعدادات المحفوظة
      const savedTheme = localStorage.getItem('theme')
      const savedSettings = localStorage.getItem('themeSettings')
      const savedCustomThemes = localStorage.getItem('customThemes')
      
      if (savedTheme) {
        state.currentTheme = savedTheme
      }
      
      if (savedSettings) {
        try {
          state.themeSettings = JSON.parse(savedSettings)
        } catch (error) {
          console.error('خطأ في تحميل إعدادات المظهر:', error)
        }
      }
      
      if (savedCustomThemes) {
        try {
          state.customThemes = JSON.parse(savedCustomThemes)
        } catch (error) {
          console.error('خطأ في تحميل المظاهر المخصصة:', error)
        }
      }
      
      // كشف مظهر النظام
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      state.systemTheme = prefersDark ? 'dark' : 'light'
      
      // مراقبة تغيير مظهر النظام
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addListener((e) => {
        state.systemTheme = e.matches ? 'dark' : 'light'
        if (state.currentTheme === 'auto') {
          document.documentElement.classList.toggle('dark', e.matches)
        }
      })
    }
  },
})

export const {
  setTheme,
  setSystemTheme,
  updateThemeSettings,
  addCustomTheme,
  removeCustomTheme,
  applyCustomTheme,
  resetThemeSettings,
  initializeTheme
} = themeSlice.actions

export default themeSlice.reducer

// Selectors
export const selectCurrentTheme = (state) => state.theme.currentTheme
export const selectSystemTheme = (state) => state.theme.systemTheme
export const selectThemeSettings = (state) => state.theme.themeSettings
export const selectCustomThemes = (state) => state.theme.customThemes
export const selectIsDarkMode = (state) => {
  const { currentTheme, systemTheme } = state.theme
  if (currentTheme === 'dark') return true
  if (currentTheme === 'light') return false
  return systemTheme === 'dark' // auto mode
}