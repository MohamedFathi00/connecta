// دوال مساعدة للمصادقة

export const TOKEN_KEY = 'social_platform_token'
export const USER_KEY = 'social_platform_user'

// حفظ التوكن في localStorage
export const setTokenToStorage = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch (error) {
    console.error('خطأ في حفظ التوكن:', error)
  }
}

// الحصول على التوكن من localStorage
export const getTokenFromStorage = () => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch (error) {
    console.error('خطأ في جلب التوكن:', error)
    return null
  }
}

// حذف التوكن من localStorage
export const clearTokenFromStorage = () => {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch (error) {
    console.error('خطأ في حذف التوكن:', error)
  }
}

// حفظ بيانات المستخدم
export const setUserToStorage = (user) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch (error) {
    console.error('خطأ في حفظ بيانات المستخدم:', error)
  }
}

// الحصول على بيانات المستخدم
export const getUserFromStorage = () => {
  try {
    const user = localStorage.getItem(USER_KEY)
    return user ? JSON.parse(user) : null
  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error)
    return null
  }
}

// التحقق من صحة التوكن
export const isTokenValid = (token) => {
  if (!token) return false
  
  try {
    // فك تشفير JWT token بسيط (بدون مكتبة)
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    
    return payload.exp > currentTime
  } catch (error) {
    console.error('خطأ في التحقق من التوكن:', error)
    return false
  }
}

// الحصول على معلومات من التوكن
export const getTokenPayload = (token) => {
  if (!token) return null
  
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (error) {
    console.error('خطأ في فك تشفير التوكن:', error)
    return null
  }
}

// تكوين headers للطلبات
export const getAuthHeaders = () => {
  const token = getTokenFromStorage()
  
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
  
  return {
    'Content-Type': 'application/json'
  }
}

// التحقق من صلاحيات المستخدم
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false
  
  const permissions = {
    user: ['read', 'create', 'update_own'],
    moderator: ['read', 'create', 'update_own', 'moderate', 'delete_others'],
    admin: ['read', 'create', 'update_own', 'moderate', 'delete_others', 'manage_users'],
    super_admin: ['*'] // جميع الصلاحيات
  }
  
  const userPermissions = permissions[user.role] || []
  
  return userPermissions.includes('*') || userPermissions.includes(permission)
}

// التحقق من كون المستخدم إداري
export const isAdmin = (user) => {
  return user && ['admin', 'super_admin'].includes(user.role)
}

// التحقق من كون المستخدم مشرف
export const isModerator = (user) => {
  return user && ['moderator', 'admin', 'super_admin'].includes(user.role)
}

// تنسيق الأخطاء
export const formatAuthError = (error) => {
  if (!error) return 'حدث خطأ غير متوقع'
  
  const errorMessages = {
    'Invalid credentials': 'بيانات الدخول غير صحيحة',
    'User not found': 'المستخدم غير موجود',
    'Account locked': 'الحساب مقفل مؤقتاً',
    'Token expired': 'انتهت صلاحية الجلسة',
    'Invalid token': 'رمز غير صالح',
    'Email already exists': 'البريد الإلكتروني مستخدم بالفعل',
    'Username already exists': 'اسم المستخدم مستخدم بالفعل',
    'Two factor required': 'مطلوب رمز التحقق الثنائي',
    'Invalid two factor code': 'رمز التحقق الثنائي غير صحيح'
  }
  
  return errorMessages[error] || error
}

// إعداد interceptor للتوكن المنتهي الصلاحية
export const setupTokenInterceptor = (api) => {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        const errorMessage = error.response.data?.message
        
        if (errorMessage === 'Token expired' || errorMessage === 'Invalid token') {
          // تسجيل خروج تلقائي
          clearTokenFromStorage()
          window.location.href = '/login'
        }
      }
      
      return Promise.reject(error)
    }
  )
}

// التحقق من قوة كلمة المرور
export const validatePasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
  
  const score = Object.values(checks).filter(Boolean).length
  
  return {
    score,
    checks,
    strength: score < 2 ? 'ضعيف' : score < 4 ? 'متوسط' : 'قوي',
    isValid: score >= 3
  }
}

// تنظيف البيانات الحساسة من console في الإنتاج
export const secureLog = (message, data = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, data)
  }
}

// تشفير البيانات الحساسة محلياً (أساسي)
export const encryptSensitiveData = (data) => {
  try {
    return btoa(JSON.stringify(data))
  } catch (error) {
    console.error('خطأ في تشفير البيانات:', error)
    return null
  }
}

// فك تشفير البيانات الحساسة محلياً (أساسي)
export const decryptSensitiveData = (encryptedData) => {
  try {
    return JSON.parse(atob(encryptedData))
  } catch (error) {
    console.error('خطأ في فك تشفير البيانات:', error)
    return null
  }
}