import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import notificationsAPI from '../../services/notificationsAPI'

// إجراءات غير متزامنة
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.getNotifications({ page, limit })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في جلب الإشعارات')
    }
  }
)

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.markAsRead(notificationId)
      return { notificationId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في تحديث الإشعار')
    }
  }
)

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.markAllAsRead()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في تحديث الإشعارات')
    }
  }
)

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationsAPI.deleteNotification(notificationId)
      return notificationId
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في حذف الإشعار')
    }
  }
)

export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.updateSettings(settings)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في تحديث الإعدادات')
    }
  }
)

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
  totalNotifications: 0,
  settings: {
    email: {
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
      messages: true,
      posts: false
    },
    push: {
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
      messages: true,
      posts: false
    },
    inApp: {
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
      messages: true,
      posts: true
    }
  },
  filters: {
    type: 'all', // all, likes, comments, follows, mentions, messages
    read: 'all' // all, read, unread
  }
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    addNotification: (state, action) => {
      // إضافة إشعار جديد من الوقت الفعلي
      state.notifications.unshift(action.payload)
      if (!action.payload.isRead) {
        state.unreadCount += 1
      }
      state.totalNotifications += 1
    },
    updateNotification: (state, action) => {
      const index = state.notifications.findIndex(n => n.id === action.payload.id)
      if (index !== -1) {
        const oldNotification = state.notifications[index]
        state.notifications[index] = { ...oldNotification, ...action.payload }
        
        // تحديث عداد غير المقروءة
        if (oldNotification.isRead !== action.payload.isRead) {
          if (action.payload.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1)
          } else {
            state.unreadCount += 1
          }
        }
      }
    },
    removeNotification: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification) {
        state.notifications = state.notifications.filter(n => n.id !== action.payload)
        if (!notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
        state.totalNotifications = Math.max(0, state.totalNotifications - 1)
      }
    },
    resetNotifications: (state) => {
      state.notifications = []
      state.page = 1
      state.hasMore = true
      state.totalNotifications = 0
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1
    },
    decrementUnreadCount: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1)
    },
    clearUnreadCount: (state) => {
      state.unreadCount = 0
    }
  },
  extraReducers: (builder) => {
    // جلب الإشعارات
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        const { notifications, unreadCount, totalNotifications, hasMore, page } = action.payload
        
        if (page === 1) {
          state.notifications = notifications
        } else {
          state.notifications = [...state.notifications, ...notifications]
        }
        
        state.unreadCount = unreadCount
        state.totalNotifications = totalNotifications
        state.hasMore = hasMore
        state.page = page
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // تحديد كمقروء
    builder
      .addCase(markAsRead.fulfilled, (state, action) => {
        const { notificationId } = action.payload
        const notification = state.notifications.find(n => n.id === notificationId)
        if (notification && !notification.isRead) {
          notification.isRead = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })

    // تحديد الكل كمقروء
    builder
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.isRead = true
        })
        state.unreadCount = 0
      })

    // حذف إشعار
    builder
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notificationId = action.payload
        const notification = state.notifications.find(n => n.id === notificationId)
        if (notification) {
          state.notifications = state.notifications.filter(n => n.id !== notificationId)
          if (!notification.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1)
          }
          state.totalNotifications = Math.max(0, state.totalNotifications - 1)
        }
      })

    // تحديث الإعدادات
    builder
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.settings = { ...state.settings, ...action.payload.settings }
      })
  },
})

export const {
  clearError,
  setFilters,
  addNotification,
  updateNotification,
  removeNotification,
  resetNotifications,
  incrementUnreadCount,
  decrementUnreadCount,
  clearUnreadCount
} = notificationsSlice.actions

export default notificationsSlice.reducer

// Selectors
export const selectNotifications = (state) => state.notifications.notifications
export const selectUnreadCount = (state) => state.notifications.unreadCount
export const selectNotificationsLoading = (state) => state.notifications.loading
export const selectNotificationsError = (state) => state.notifications.error
export const selectHasMoreNotifications = (state) => state.notifications.hasMore
export const selectNotificationSettings = (state) => state.notifications.settings
export const selectNotificationFilters = (state) => state.notifications.filters

// Selectors مفلترة
export const selectFilteredNotifications = (state) => {
  const { notifications, filters } = state.notifications
  
  return notifications.filter(notification => {
    // فلترة حسب النوع
    if (filters.type !== 'all' && notification.type !== filters.type) {
      return false
    }
    
    // فلترة حسب حالة القراءة
    if (filters.read === 'read' && !notification.isRead) {
      return false
    }
    
    if (filters.read === 'unread' && notification.isRead) {
      return false
    }
    
    return true
  })
}