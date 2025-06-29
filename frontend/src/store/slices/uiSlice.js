import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // حالة الشريط الجانبي
  sidebarOpen: false,
  sidebarCollapsed: false,
  
  // حالة الأجهزة المحمولة
  isMobile: false,
  isTablet: false,
  
  // Modals
  modalsOpen: {},
  
  // التحميل العام
  globalLoading: false,
  loadingMessage: '',
  
  // الرسائل والتنبيهات
  alerts: [],
  toasts: [],
  
  // حالة التطبيق
  isOnline: true,
  lastActivity: null,
  
  // إعدادات واجهة المستخدم
  uiSettings: {
    compactMode: false,
    showPreview: true,
    autoRefresh: true,
    soundEnabled: true,
    vibrationEnabled: true,
    showReadReceipts: true,
    showTypingIndicator: true,
    animationsEnabled: true
  },
  
  // حالة البحث
  searchOpen: false,
  searchQuery: '',
  searchHistory: [],
  
  // حالة المشاركة
  shareModalOpen: false,
  shareData: null,
  
  // حالة الكاميرا والوسائط
  cameraOpen: false,
  mediaPreview: null,
  
  // حالة الإعدادات
  settingsOpen: false,
  settingsTab: 'general',
  
  // حالة الإشعارات
  notificationPermission: 'default', // default, granted, denied
  pushSubscription: null,
  
  // حالة الاتصال
  connectionStatus: 'connected', // connected, disconnected, reconnecting
  
  // إعدادات التطبيق
  appSettings: {
    language: 'ar',
    timezone: 'Asia/Riyadh',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12', // 12 or 24
    numberFormat: 'ar-SA'
  }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // الشريط الجانبي
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload
    },
    
    // حالة الجهاز
    setDeviceType: (state, action) => {
      const { isMobile, isTablet } = action.payload
      state.isMobile = isMobile
      state.isTablet = isTablet
      
      // إغلاق الشريط الجانبي تلقائياً على الأجهزة المحمولة
      if (isMobile) {
        state.sidebarOpen = false
      }
    },
    
    // Modals
    openModal: (state, action) => {
      const { modalId, data = null } = action.payload
      state.modalsOpen[modalId] = { isOpen: true, data }
    },
    closeModal: (state, action) => {
      const modalId = action.payload
      if (state.modalsOpen[modalId]) {
        state.modalsOpen[modalId].isOpen = false
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modalsOpen).forEach(modalId => {
        state.modalsOpen[modalId].isOpen = false
      })
    },
    
    // التحميل العام
    setGlobalLoading: (state, action) => {
      const { loading, message = '' } = action.payload
      state.globalLoading = loading
      state.loadingMessage = message
    },
    
    // التنبيهات
    addAlert: (state, action) => {
      const alert = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...action.payload
      }
      state.alerts.push(alert)
    },
    removeAlert: (state, action) => {
      state.alerts = state.alerts.filter(alert => alert.id !== action.payload)
    },
    clearAlerts: (state) => {
      state.alerts = []
    },
    
    // Toast notifications
    addToast: (state, action) => {
      const toast = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        duration: 4000,
        ...action.payload
      }
      state.toasts.push(toast)
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload)
    },
    clearToasts: (state) => {
      state.toasts = []
    },
    
    // حالة الاتصال
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload
    },
    updateLastActivity: (state) => {
      state.lastActivity = new Date().toISOString()
    },
    setConnectionStatus: (state, action) => {
      state.connectionStatus = action.payload
    },
    
    // إعدادات واجهة المستخدم
    updateUiSettings: (state, action) => {
      state.uiSettings = { ...state.uiSettings, ...action.payload }
      
      // حفظ في localStorage
      try {
        localStorage.setItem('uiSettings', JSON.stringify(state.uiSettings))
      } catch (error) {
        console.error('خطأ في حفظ إعدادات الواجهة:', error)
      }
    },
    
    // البحث
    setSearchOpen: (state, action) => {
      state.searchOpen = action.payload
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
    },
    addToSearchHistory: (state, action) => {
      const query = action.payload
      
      // إزالة الاستعلام إذا كان موجوداً مسبقاً
      state.searchHistory = state.searchHistory.filter(item => item !== query)
      
      // إضافة في المقدمة
      state.searchHistory.unshift(query)
      
      // الاحتفاظ بـ 10 عناصر فقط
      state.searchHistory = state.searchHistory.slice(0, 10)
      
      // حفظ في localStorage
      try {
        localStorage.setItem('searchHistory', JSON.stringify(state.searchHistory))
      } catch (error) {
        console.error('خطأ في حفظ تاريخ البحث:', error)
      }
    },
    clearSearchHistory: (state) => {
      state.searchHistory = []
      try {
        localStorage.removeItem('searchHistory')
      } catch (error) {
        console.error('خطأ في حذف تاريخ البحث:', error)
      }
    },
    
    // المشاركة
    openShareModal: (state, action) => {
      state.shareModalOpen = true
      state.shareData = action.payload
    },
    closeShareModal: (state) => {
      state.shareModalOpen = false
      state.shareData = null
    },
    
    // الكاميرا والوسائط
    setCameraOpen: (state, action) => {
      state.cameraOpen = action.payload
    },
    setMediaPreview: (state, action) => {
      state.mediaPreview = action.payload
    },
    clearMediaPreview: (state) => {
      state.mediaPreview = null
    },
    
    // الإعدادات
    setSettingsOpen: (state, action) => {
      state.settingsOpen = action.payload
    },
    setSettingsTab: (state, action) => {
      state.settingsTab = action.payload
    },
    
    // الإشعارات
    setNotificationPermission: (state, action) => {
      state.notificationPermission = action.payload
    },
    setPushSubscription: (state, action) => {
      state.pushSubscription = action.payload
    },
    
    // إعدادات التطبيق
    updateAppSettings: (state, action) => {
      state.appSettings = { ...state.appSettings, ...action.payload }
      
      // حفظ في localStorage
      try {
        localStorage.setItem('appSettings', JSON.stringify(state.appSettings))
      } catch (error) {
        console.error('خطأ في حفظ إعدادات التطبيق:', error)
      }
    },
    
    // تهيئة الإعدادات من localStorage
    initializeSettings: (state) => {
      try {
        // تحميل إعدادات الواجهة
        const uiSettings = localStorage.getItem('uiSettings')
        if (uiSettings) {
          state.uiSettings = { ...state.uiSettings, ...JSON.parse(uiSettings) }
        }
        
        // تحميل إعدادات التطبيق
        const appSettings = localStorage.getItem('appSettings')
        if (appSettings) {
          state.appSettings = { ...state.appSettings, ...JSON.parse(appSettings) }
        }
        
        // تحميل تاريخ البحث
        const searchHistory = localStorage.getItem('searchHistory')
        if (searchHistory) {
          state.searchHistory = JSON.parse(searchHistory)
        }
      } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error)
      }
    },
    
    // إعادة تعيين جميع الإعدادات
    resetAllSettings: (state) => {
      state.uiSettings = initialState.uiSettings
      state.appSettings = initialState.appSettings
      state.searchHistory = []
      
      // حذف من localStorage
      try {
        localStorage.removeItem('uiSettings')
        localStorage.removeItem('appSettings')
        localStorage.removeItem('searchHistory')
      } catch (error) {
        console.error('خطأ في حذف الإعدادات:', error)
      }
    }
  },
})

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  setDeviceType,
  openModal,
  closeModal,
  closeAllModals,
  setGlobalLoading,
  addAlert,
  removeAlert,
  clearAlerts,
  addToast,
  removeToast,
  clearToasts,
  setOnlineStatus,
  updateLastActivity,
  setConnectionStatus,
  updateUiSettings,
  setSearchOpen,
  setSearchQuery,
  addToSearchHistory,
  clearSearchHistory,
  openShareModal,
  closeShareModal,
  setCameraOpen,
  setMediaPreview,
  clearMediaPreview,
  setSettingsOpen,
  setSettingsTab,
  setNotificationPermission,
  setPushSubscription,
  updateAppSettings,
  initializeSettings,
  resetAllSettings
} = uiSlice.actions

export default uiSlice.reducer

// Selectors
export const selectSidebarOpen = (state) => state.ui.sidebarOpen
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed
export const selectIsMobile = (state) => state.ui.isMobile
export const selectIsTablet = (state) => state.ui.isTablet
export const selectModalOpen = (modalId) => (state) => 
  state.ui.modalsOpen[modalId]?.isOpen || false
export const selectModalData = (modalId) => (state) => 
  state.ui.modalsOpen[modalId]?.data || null
export const selectGlobalLoading = (state) => state.ui.globalLoading
export const selectLoadingMessage = (state) => state.ui.loadingMessage
export const selectAlerts = (state) => state.ui.alerts
export const selectToasts = (state) => state.ui.toasts
export const selectIsOnline = (state) => state.ui.isOnline
export const selectConnectionStatus = (state) => state.ui.connectionStatus
export const selectUiSettings = (state) => state.ui.uiSettings
export const selectSearchOpen = (state) => state.ui.searchOpen
export const selectSearchQuery = (state) => state.ui.searchQuery
export const selectSearchHistory = (state) => state.ui.searchHistory
export const selectShareModalOpen = (state) => state.ui.shareModalOpen
export const selectShareData = (state) => state.ui.shareData
export const selectCameraOpen = (state) => state.ui.cameraOpen
export const selectMediaPreview = (state) => state.ui.mediaPreview
export const selectSettingsOpen = (state) => state.ui.settingsOpen
export const selectSettingsTab = (state) => state.ui.settingsTab
export const selectNotificationPermission = (state) => state.ui.notificationPermission
export const selectAppSettings = (state) => state.ui.appSettings