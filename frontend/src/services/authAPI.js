import { apiRequest } from './api'

const authAPI = {
  // تسجيل الدخول
  login: async (credentials) => {
    return apiRequest.post('/auth/login', credentials)
  },
  
  // إنشاء حساب جديد
  register: async (userData) => {
    return apiRequest.post('/auth/register', userData)
  },
  
  // التحقق من التوكن
  verifyToken: async () => {
    return apiRequest.get('/auth/verify')
  },
  
  // تحديث الملف الشخصي
  updateProfile: async (profileData) => {
    return apiRequest.put('/auth/profile', profileData)
  },
  
  // تغيير كلمة المرور
  changePassword: async (passwordData) => {
    return apiRequest.put('/auth/change-password', passwordData)
  },
  
  // نسيت كلمة المرور
  forgotPassword: async (email) => {
    return apiRequest.post('/auth/forgot-password', { email })
  },
  
  // إعادة تعيين كلمة المرور
  resetPassword: async (token, newPassword) => {
    return apiRequest.post('/auth/reset-password', { token, newPassword })
  },
  
  // تفعيل البريد الإلكتروني
  verifyEmail: async (token) => {
    return apiRequest.post('/auth/verify-email', { token })
  },
  
  // إعادة إرسال رسالة التفعيل
  resendVerification: async () => {
    return apiRequest.post('/auth/resend-verification')
  },
  
  // إعداد المصادقة الثنائية
  setup2FA: async () => {
    return apiRequest.post('/auth/2fa/setup')
  },
  
  // تفعيل المصادقة الثنائية
  enable2FA: async (token) => {
    return apiRequest.post('/auth/2fa/enable', { token })
  },
  
  // إلغاء تفعيل المصادقة الثنائية
  disable2FA: async (token) => {
    return apiRequest.post('/auth/2fa/disable', { token })
  },
  
  // التحقق من رمز 2FA
  verify2FA: async (token) => {
    return apiRequest.post('/auth/2fa/verify', { token })
  },
  
  // الحصول على رموز النسخ الاحتياطي
  getBackupCodes: async () => {
    return apiRequest.get('/auth/2fa/backup-codes')
  },
  
  // تجديد رموز النسخ الاحتياطي
  regenerateBackupCodes: async () => {
    return apiRequest.post('/auth/2fa/backup-codes/regenerate')
  },
  
  // تسجيل الخروج
  logout: async () => {
    return apiRequest.post('/auth/logout')
  },
  
  // تسجيل الخروج من جميع الأجهزة
  logoutAll: async () => {
    return apiRequest.post('/auth/logout-all')
  },
  
  // الحصول على الجلسات النشطة
  getActiveSessions: async () => {
    return apiRequest.get('/auth/sessions')
  },
  
  // إنهاء جلسة معينة
  terminateSession: async (sessionId) => {
    return apiRequest.delete(`/auth/sessions/${sessionId}`)
  },
  
  // حذف الحساب
  deleteAccount: async (password) => {
    return apiRequest.delete('/auth/account', { data: { password } })
  },
  
  // تحديث إعدادات الخصوصية
  updatePrivacySettings: async (settings) => {
    return apiRequest.put('/auth/privacy', settings)
  },
  
  // الحصول على إعدادات الخصوصية
  getPrivacySettings: async () => {
    return apiRequest.get('/auth/privacy')
  },
  
  // تحديث إعدادات الإشعارات
  updateNotificationSettings: async (settings) => {
    return apiRequest.put('/auth/notifications', settings)
  },
  
  // الحصول على إعدادات الإشعارات
  getNotificationSettings: async () => {
    return apiRequest.get('/auth/notifications')
  },
  
  // تحديث الصورة الشخصية
  updateAvatar: async (avatarFile) => {
    const formData = new FormData()
    formData.append('avatar', avatarFile)
    
    return apiRequest.post('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  // حذف الصورة الشخصية
  deleteAvatar: async () => {
    return apiRequest.delete('/auth/avatar')
  },
  
  // تحديث صورة الغلاف
  updateCoverPhoto: async (coverFile) => {
    const formData = new FormData()
    formData.append('cover', coverFile)
    
    return apiRequest.post('/auth/cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  
  // حذف صورة الغلاف
  deleteCoverPhoto: async () => {
    return apiRequest.delete('/auth/cover')
  },
  
  // إعداد PIN للحماية الإضافية
  setupPIN: async (pin) => {
    return apiRequest.post('/auth/pin/setup', { pin })
  },
  
  // تغيير PIN
  changePIN: async (oldPin, newPin) => {
    return apiRequest.put('/auth/pin/change', { oldPin, newPin })
  },
  
  // التحقق من PIN
  verifyPIN: async (pin) => {
    return apiRequest.post('/auth/pin/verify', { pin })
  },
  
  // إلغاء PIN
  disablePIN: async (pin) => {
    return apiRequest.delete('/auth/pin', { data: { pin } })
  },
  
  // تحديث إعدادات الأمان
  updateSecuritySettings: async (settings) => {
    return apiRequest.put('/auth/security', settings)
  },
  
  // الحصول على إعدادات الأمان
  getSecuritySettings: async () => {
    return apiRequest.get('/auth/security')
  },
  
  // تحديث الموقع
  updateLocation: async (location) => {
    return apiRequest.put('/auth/location', location)
  },
  
  // إزالة الموقع
  removeLocation: async () => {
    return apiRequest.delete('/auth/location')
  },
  
  // تحديث اللغة والمنطقة الزمنية
  updateLocalization: async (settings) => {
    return apiRequest.put('/auth/localization', settings)
  },
  
  // الحصول على سجل الأنشطة
  getActivityLog: async (page = 1, limit = 20) => {
    return apiRequest.get('/auth/activity', {
      params: { page, limit }
    })
  },
  
  // تنظيف سجل الأنشطة
  clearActivityLog: async () => {
    return apiRequest.delete('/auth/activity')
  },
  
  // تحديث تفضيلات التطبيق
  updatePreferences: async (preferences) => {
    return apiRequest.put('/auth/preferences', preferences)
  },
  
  // الحصول على تفضيلات التطبيق
  getPreferences: async () => {
    return apiRequest.get('/auth/preferences')
  },
  
  // تصدير البيانات الشخصية
  exportData: async () => {
    return apiRequest.post('/auth/export-data')
  },
  
  // الحصول على حالة تصدير البيانات
  getExportStatus: async (exportId) => {
    return apiRequest.get(`/auth/export-data/${exportId}`)
  },
  
  // تحديث حالة النشاط
  updateStatus: async (status) => {
    return apiRequest.put('/auth/status', { status })
  },
  
  // الحصول على الإحصائيات الشخصية
  getPersonalStats: async () => {
    return apiRequest.get('/auth/stats')
  }
}

export default authAPI