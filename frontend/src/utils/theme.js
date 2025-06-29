// دوال مساعدة للمظهر

export const THEME_KEY = 'social_platform_theme'
export const THEME_SETTINGS_KEY = 'social_platform_theme_settings'

// الحصول على المظهر المحفوظ
export const getStoredTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY) || 'light'
  } catch (error) {
    console.error('خطأ في جلب المظهر:', error)
    return 'light'
  }
}

// حفظ المظهر
export const storeTheme = (theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch (error) {
    console.error('خطأ في حفظ المظهر:', error)
  }
}

// الحصول على إعدادات المظهر المحفوظة
export const getStoredThemeSettings = () => {
  try {
    const settings = localStorage.getItem(THEME_SETTINGS_KEY)
    return settings ? JSON.parse(settings) : null
  } catch (error) {
    console.error('خطأ في جلب إعدادات المظهر:', error)
    return null
  }
}

// حفظ إعدادات المظهر
export const storeThemeSettings = (settings) => {
  try {
    localStorage.setItem(THEME_SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('خطأ في حفظ إعدادات المظهر:', error)
  }
}

// كشف مظهر النظام
export const getSystemTheme = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

// تطبيق المظهر على DOM
export const applyTheme = (theme) => {
  const root = document.documentElement
  
  switch (theme) {
    case 'dark':
      root.classList.add('dark')
      break
    case 'light':
      root.classList.remove('dark')
      break
    case 'auto':
      const systemTheme = getSystemTheme()
      if (systemTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      break
    default:
      root.classList.remove('dark')
  }
}

// الألوان المتاحة
export const availableColors = {
  blue: {
    name: 'أزرق',
    primary: '#3b82f6',
    secondary: '#1e40af',
    light: '#dbeafe',
    dark: '#1e3a8a'
  },
  purple: {
    name: 'بنفسجي',
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    light: '#e9d5ff',
    dark: '#581c87'
  },
  green: {
    name: 'أخضر',
    primary: '#10b981',
    secondary: '#059669',
    light: '#d1fae5',
    dark: '#064e3b'
  },
  red: {
    name: 'أحمر',
    primary: '#ef4444',
    secondary: '#dc2626',
    light: '#fee2e2',
    dark: '#7f1d1d'
  },
  indigo: {
    name: 'نيلي',
    primary: '#6366f1',
    secondary: '#4f46e5',
    light: '#e0e7ff',
    dark: '#312e81'
  },
  pink: {
    name: 'وردي',
    primary: '#ec4899',
    secondary: '#db2777',
    light: '#fce7f3',
    dark: '#831843'
  },
  orange: {
    name: 'برتقالي',
    primary: '#f97316',
    secondary: '#ea580c',
    light: '#fed7aa',
    dark: '#9a3412'
  },
  teal: {
    name: 'تيل',
    primary: '#14b8a6',
    secondary: '#0d9488',
    light: '#ccfbf1',
    dark: '#134e4a'
  }
}

// أحجام النصوص المتاحة
export const fontSizes = {
  small: {
    name: 'صغير',
    baseSize: '14px',
    scale: 0.875
  },
  medium: {
    name: 'متوسط',
    baseSize: '16px',
    scale: 1
  },
  large: {
    name: 'كبير',
    baseSize: '18px',
    scale: 1.125
  },
  xlarge: {
    name: 'كبير جداً',
    baseSize: '20px',
    scale: 1.25
  }
}

// أحجام الحواف المتاحة
export const borderRadii = {
  none: {
    name: 'بدون',
    value: '0px'
  },
  small: {
    name: 'صغير',
    value: '4px'
  },
  medium: {
    name: 'متوسط',
    value: '8px'
  },
  large: {
    name: 'كبير',
    value: '12px'
  },
  full: {
    name: 'دائري',
    value: '9999px'
  }
}

// تطبيق إعدادات المظهر المخصصة
export const applyCustomThemeSettings = (settings) => {
  const root = document.documentElement
  
  // تطبيق اللون الأساسي
  if (settings.primaryColor && availableColors[settings.primaryColor]) {
    const color = availableColors[settings.primaryColor]
    root.style.setProperty('--color-primary', color.primary)
    root.style.setProperty('--color-primary-dark', color.secondary)
    root.style.setProperty('--color-primary-light', color.light)
  }
  
  // تطبيق اللون الثانوي
  if (settings.accentColor && availableColors[settings.accentColor]) {
    const color = availableColors[settings.accentColor]
    root.style.setProperty('--color-accent', color.primary)
    root.style.setProperty('--color-accent-dark', color.secondary)
    root.style.setProperty('--color-accent-light', color.light)
  }
  
  // تطبيق حجم الخط
  if (settings.fontSize && fontSizes[settings.fontSize]) {
    const fontSize = fontSizes[settings.fontSize]
    root.style.setProperty('--font-size-base', fontSize.baseSize)
    root.style.setProperty('--font-scale', fontSize.scale.toString())
  }
  
  // تطبيق نصف القطر
  if (settings.borderRadius && borderRadii[settings.borderRadius]) {
    const radius = borderRadii[settings.borderRadius]
    root.style.setProperty('--border-radius', radius.value)
  }
  
  // تطبيق الحركات
  if (typeof settings.animations === 'boolean') {
    root.style.setProperty('--animations-enabled', settings.animations ? '1' : '0')
    if (!settings.animations) {
      root.classList.add('no-animations')
    } else {
      root.classList.remove('no-animations')
    }
  }
  
  // تطبيق الحركة المقللة
  if (typeof settings.reducedMotion === 'boolean') {
    root.style.setProperty('--reduced-motion', settings.reducedMotion ? '1' : '0')
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }
  }
  
  // تطبيق الوضع المضغوط
  if (typeof settings.compactMode === 'boolean') {
    if (settings.compactMode) {
      root.classList.add('compact-mode')
    } else {
      root.classList.remove('compact-mode')
    }
  }
}

// إنشاء مظهر مخصص
export const createCustomTheme = (name, settings) => {
  return {
    id: `custom_${Date.now()}`,
    name,
    type: 'custom',
    settings,
    createdAt: new Date().toISOString()
  }
}

// التحقق من دعم المتصفح للمظاهر
export const checkThemeSupport = () => {
  return {
    darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined,
    reducedMotion: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches !== undefined,
    localStorage: typeof Storage !== 'undefined'
  }
}

// حساب التباين بين الألوان
export const calculateContrast = (color1, color2) => {
  // تحويل الألوان إلى RGB
  const getRGB = (color) => {
    const hex = color.replace('#', '')
    return {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16)
    }
  }
  
  // حساب اللمعان النسبي
  const getLuminance = (rgb) => {
    const rsRGB = rgb.r / 255
    const gsRGB = rgb.g / 255
    const bsRGB = rgb.b / 255
    
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4)
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4)
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4)
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  
  const rgb1 = getRGB(color1)
  const rgb2 = getRGB(color2)
  
  const lum1 = getLuminance(rgb1)
  const lum2 = getLuminance(rgb2)
  
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  
  return (brightest + 0.05) / (darkest + 0.05)
}

// التحقق من إمكانية الوصول
export const checkAccessibility = (settings) => {
  const warnings = []
  
  if (settings.primaryColor && settings.backgroundColor) {
    const contrast = calculateContrast(
      availableColors[settings.primaryColor].primary,
      settings.backgroundColor
    )
    
    if (contrast < 4.5) {
      warnings.push('التباين بين اللون الأساسي والخلفية قد يكون ضعيفاً')
    }
  }
  
  if (settings.fontSize === 'small') {
    warnings.push('حجم الخط الصغير قد يصعب القراءة لبعض المستخدمين')
  }
  
  if (!settings.reducedMotion && settings.animations) {
    warnings.push('قد ترغب في تقليل الحركات للمستخدمين الذين يعانون من الدوار')
  }
  
  return {
    isAccessible: warnings.length === 0,
    warnings
  }
}