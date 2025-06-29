import axios from 'axios'
import { getTokenFromStorage, clearTokenFromStorage } from '../utils/auth'

// إعداد Axios الأساسي
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor للطلبات (إضافة التوكن)
api.interceptors.request.use(
  (config) => {
    const token = getTokenFromStorage()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // إضافة timestamp لتجنب cache
    config.params = {
      ...config.params,
      _t: Date.now()
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor للاستجابات (معالجة الأخطاء)
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // معالجة أخطاء الشبكة
    if (error.code === 'ECONNABORTED') {
      error.message = 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.'
    } else if (!error.response) {
      error.message = 'خطأ في الشبكة. تحقق من اتصالك بالإنترنت.'
    } else {
      // معالجة أخطاء HTTP
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // التوكن منتهي الصلاحية أو غير صحيح
          if (data.message === 'Token expired' || data.message === 'Invalid token') {
            clearTokenFromStorage()
            window.location.href = '/login'
            return Promise.reject(new Error('انتهت صلاحية الجلسة'))
          }
          break
          
        case 403:
          error.message = 'ليس لديك صلاحية للوصول إلى هذا المورد'
          break
          
        case 404:
          error.message = 'المورد المطلوب غير موجود'
          break
          
        case 422:
          // أخطاء التحقق من صحة البيانات
          if (data.errors) {
            error.message = Object.values(data.errors).flat().join('\n')
          } else {
            error.message = data.message || 'بيانات غير صحيحة'
          }
          break
          
        case 429:
          error.message = 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً'
          break
          
        case 500:
          error.message = 'خطأ في الخادم. يرجى المحاولة لاحقاً'
          break
          
        case 502:
        case 503:
        case 504:
          error.message = 'الخادم غير متاح حالياً. يرجى المحاولة لاحقاً'
          break
          
        default:
          error.message = data.message || 'حدث خطأ غير متوقع'
      }
    }
    
    return Promise.reject(error)
  }
)

// دوال مساعدة للطلبات الشائعة
export const apiRequest = {
  get: (url, config = {}) => api.get(url, config),
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),
}

// دوال للملفات والوسائط
export const uploadFile = async (file, onProgress = null) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }
  
  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      )
      onProgress(percentCompleted)
    }
  }
  
  return api.post('/upload', formData, config)
}

export const uploadMultipleFiles = async (files, onProgress = null) => {
  const formData = new FormData()
  files.forEach((file, index) => {
    formData.append(`files[${index}]`, file)
  })
  
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }
  
  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      )
      onProgress(percentCompleted)
    }
  }
  
  return api.post('/upload/multiple', formData, config)
}

// دوال للصور والفيديو
export const uploadImage = async (imageFile, options = {}) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  
  // إضافة خيارات معالجة الصورة
  if (options.resize) {
    formData.append('resize', JSON.stringify(options.resize))
  }
  
  if (options.quality) {
    formData.append('quality', options.quality)
  }
  
  return api.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const uploadVideo = async (videoFile, onProgress = null) => {
  const formData = new FormData()
  formData.append('video', videoFile)
  
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 دقائق للفيديو
  }
  
  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      )
      onProgress(percentCompleted)
    }
  }
  
  return api.post('/upload/video', formData, config)
}

// دوال لمعالجة الاستجابات
export const handleApiResponse = (response) => {
  return response.data
}

export const handleApiError = (error) => {
  console.error('API Error:', error)
  
  if (error.response) {
    // الخادم أرجع استجابة مع خطأ
    throw new Error(error.response.data.message || 'حدث خطأ في الخادم')
  } else if (error.request) {
    // الطلب تم إرساله لكن لم نتلق استجابة
    throw new Error('لا يمكن الاتصال بالخادم')
  } else {
    // خطأ في إعداد الطلب
    throw new Error('خطأ في الطلب')
  }
}

// دوال للتحقق من الاتصال
export const checkConnection = async () => {
  try {
    await api.get('/health')
    return true
  } catch (error) {
    return false
  }
}

// دوال للتحليلات والإحصائيات
export const trackEvent = async (eventName, properties = {}) => {
  try {
    await api.post('/analytics/event', {
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    })
  } catch (error) {
    // لا نريد أن تؤثر أخطاء التحليلات على تجربة المستخدم
    console.warn('Analytics error:', error)
  }
}

// دوال للبحث المتقدم
export const searchWithFilters = async (query, filters = {}, options = {}) => {
  return api.get('/search', {
    params: {
      q: query,
      ...filters,
      ...options,
    },
  })
}

// دوال للإشعارات
export const registerPushNotifications = async (subscription) => {
  return api.post('/notifications/push/register', { subscription })
}

export const unregisterPushNotifications = async () => {
  return api.delete('/notifications/push/unregister')
}

// دوال للكاش والتخزين المؤقت
export const getCachedData = (key) => {
  try {
    const cached = localStorage.getItem(`cache_${key}`)
    if (cached) {
      const { data, timestamp, ttl } = JSON.parse(cached)
      if (Date.now() - timestamp < ttl) {
        return data
      }
      localStorage.removeItem(`cache_${key}`)
    }
  } catch (error) {
    console.error('Cache error:', error)
  }
  return null
}

export const setCachedData = (key, data, ttl = 300000) => { // 5 دقائق افتراضي
  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now(),
      ttl,
    }))
  } catch (error) {
    console.error('Cache error:', error)
  }
}

export const clearCache = (pattern = null) => {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        if (!pattern || key.includes(pattern)) {
          localStorage.removeItem(key)
        }
      }
    })
  } catch (error) {
    console.error('Cache clear error:', error)
  }
}

export default api