import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import messagesAPI from '../../services/messagesAPI'

// إجراءات غير متزامنة
export const fetchConversations = createAsyncThunk(
  'messages/fetchConversations',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.getConversations({ page, limit })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في جلب المحادثات')
    }
  }
)

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ conversationId, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.getMessages(conversationId, { page, limit })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في جلب الرسائل')
    }
  }
)

export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ conversationId, content, type = 'text', attachments = [] }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.sendMessage(conversationId, {
        content,
        type,
        attachments
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في إرسال الرسالة')
    }
  }
)

export const createConversation = createAsyncThunk(
  'messages/createConversation',
  async ({ participantIds, type = 'direct' }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.createConversation({
        participantIds,
        type
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في إنشاء المحادثة')
    }
  }
)

export const markAsRead = createAsyncThunk(
  'messages/markAsRead',
  async ({ conversationId, messageId }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.markAsRead(conversationId, messageId)
      return { conversationId, messageId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في تحديث الرسالة')
    }
  }
)

export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async ({ conversationId, messageId }, { rejectWithValue }) => {
    try {
      await messagesAPI.deleteMessage(conversationId, messageId)
      return { conversationId, messageId }
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في حذف الرسالة')
    }
  }
)

export const muteConversation = createAsyncThunk(
  'messages/muteConversation',
  async ({ conversationId, duration }, { rejectWithValue }) => {
    try {
      const response = await messagesAPI.muteConversation(conversationId, duration)
      return { conversationId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في كتم المحادثة')
    }
  }
)

const initialState = {
  conversations: [],
  messages: {},
  currentConversation: null,
  loading: false,
  messagesLoading: false,
  sending: false,
  error: null,
  hasMoreConversations: true,
  hasMoreMessages: {},
  conversationsPage: 1,
  messagesPage: {},
  totalUnreadCount: 0,
  typingUsers: {},
  onlineUsers: [],
  searchQuery: '',
  searchResults: [],
  searchLoading: false
}

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload
    },
    clearCurrentConversation: (state) => {
      state.currentConversation = null
    },
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload
      
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = []
      }
      
      // تجنب الرسائل المكررة
      const existingMessage = state.messages[conversationId].find(m => m.id === message.id)
      if (!existingMessage) {
        state.messages[conversationId].push(message)
        
        // ترتيب الرسائل حسب التاريخ
        state.messages[conversationId].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        )
      }
      
      // تحديث آخر رسالة في المحادثة
      const conversation = state.conversations.find(c => c.id === conversationId)
      if (conversation) {
        conversation.lastMessage = message
        conversation.updatedAt = message.createdAt
        
        // إعادة ترتيب المحادثات
        state.conversations.sort((a, b) => 
          new Date(b.updatedAt) - new Date(a.updatedAt)
        )
      }
    },
    updateMessage: (state, action) => {
      const { conversationId, messageId, updates } = action.payload
      
      if (state.messages[conversationId]) {
        const messageIndex = state.messages[conversationId].findIndex(m => m.id === messageId)
        if (messageIndex !== -1) {
          state.messages[conversationId][messageIndex] = {
            ...state.messages[conversationId][messageIndex],
            ...updates
          }
        }
      }
    },
    removeMessage: (state, action) => {
      const { conversationId, messageId } = action.payload
      
      if (state.messages[conversationId]) {
        state.messages[conversationId] = state.messages[conversationId].filter(
          m => m.id !== messageId
        )
      }
    },
    updateConversation: (state, action) => {
      const { conversationId, updates } = action.payload
      const conversationIndex = state.conversations.findIndex(c => c.id === conversationId)
      
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex] = {
          ...state.conversations[conversationIndex],
          ...updates
        }
      }
    },
    addTypingUser: (state, action) => {
      const { conversationId, userId } = action.payload
      
      if (!state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = []
      }
      
      if (!state.typingUsers[conversationId].includes(userId)) {
        state.typingUsers[conversationId].push(userId)
      }
    },
    removeTypingUser: (state, action) => {
      const { conversationId, userId } = action.payload
      
      if (state.typingUsers[conversationId]) {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
          id => id !== userId
        )
      }
    },
    updateOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
    },
    clearSearchResults: (state) => {
      state.searchResults = []
      state.searchQuery = ''
    },
    updateUnreadCount: (state, action) => {
      const { conversationId, count } = action.payload
      const conversation = state.conversations.find(c => c.id === conversationId)
      
      if (conversation) {
        const oldCount = conversation.unreadCount || 0
        conversation.unreadCount = count
        state.totalUnreadCount = state.totalUnreadCount - oldCount + count
      }
    },
    resetMessages: (state) => {
      state.messages = {}
      state.messagesPage = {}
      state.hasMoreMessages = {}
    }
  },
  extraReducers: (builder) => {
    // جلب المحادثات
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false
        const { conversations, hasMore, page, totalUnreadCount } = action.payload
        
        if (page === 1) {
          state.conversations = conversations
        } else {
          state.conversations = [...state.conversations, ...conversations]
        }
        
        state.hasMoreConversations = hasMore
        state.conversationsPage = page
        state.totalUnreadCount = totalUnreadCount
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // جلب الرسائل
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.messagesLoading = true
        state.error = null
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false
        const { conversationId, messages, hasMore, page } = action.payload
        
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = []
        }
        
        if (page === 1) {
          state.messages[conversationId] = messages
        } else {
          state.messages[conversationId] = [...messages, ...state.messages[conversationId]]
        }
        
        state.hasMoreMessages[conversationId] = hasMore
        state.messagesPage[conversationId] = page
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesLoading = false
        state.error = action.payload
      })

    // إرسال رسالة
    builder
      .addCase(sendMessage.pending, (state) => {
        state.sending = true
        state.error = null
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false
        const { conversationId, message } = action.payload
        
        // إضافة الرسالة
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = []
        }
        
        state.messages[conversationId].push(message)
        
        // تحديث المحادثة
        const conversation = state.conversations.find(c => c.id === conversationId)
        if (conversation) {
          conversation.lastMessage = message
          conversation.updatedAt = message.createdAt
          
          // إعادة ترتيب المحادثات
          state.conversations.sort((a, b) => 
            new Date(b.updatedAt) - new Date(a.updatedAt)
          )
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sending = false
        state.error = action.payload
      })

    // إنشاء محادثة
    builder
      .addCase(createConversation.fulfilled, (state, action) => {
        const newConversation = action.payload.conversation
        
        // تجنب المحادثات المكررة
        const existingConversation = state.conversations.find(c => c.id === newConversation.id)
        if (!existingConversation) {
          state.conversations.unshift(newConversation)
        }
        
        state.currentConversation = newConversation
      })

    // تحديد كمقروء
    builder
      .addCase(markAsRead.fulfilled, (state, action) => {
        const { conversationId, messageId } = action.payload
        
        // تحديث الرسالة
        if (state.messages[conversationId]) {
          const message = state.messages[conversationId].find(m => m.id === messageId)
          if (message) {
            message.isRead = true
          }
        }
        
        // تحديث المحادثة
        const conversation = state.conversations.find(c => c.id === conversationId)
        if (conversation && conversation.unreadCount > 0) {
          conversation.unreadCount -= 1
          state.totalUnreadCount = Math.max(0, state.totalUnreadCount - 1)
        }
      })

    // حذف رسالة
    builder
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { conversationId, messageId } = action.payload
        
        if (state.messages[conversationId]) {
          state.messages[conversationId] = state.messages[conversationId].filter(
            m => m.id !== messageId
          )
        }
      })

    // كتم المحادثة
    builder
      .addCase(muteConversation.fulfilled, (state, action) => {
        const { conversationId, isMuted, mutedUntil } = action.payload
        const conversation = state.conversations.find(c => c.id === conversationId)
        
        if (conversation) {
          conversation.isMuted = isMuted
          conversation.mutedUntil = mutedUntil
        }
      })
  },
})

export const {
  clearError,
  setCurrentConversation,
  clearCurrentConversation,
  addMessage,
  updateMessage,
  removeMessage,
  updateConversation,
  addTypingUser,
  removeTypingUser,
  updateOnlineUsers,
  setSearchQuery,
  clearSearchResults,
  updateUnreadCount,
  resetMessages
} = messagesSlice.actions

export default messagesSlice.reducer

// Selectors
export const selectConversations = (state) => state.messages.conversations
export const selectCurrentConversation = (state) => state.messages.currentConversation
export const selectMessages = (conversationId) => (state) => 
  state.messages.messages[conversationId] || []
export const selectMessagesLoading = (state) => state.messages.messagesLoading
export const selectSending = (state) => state.messages.sending
export const selectMessagesError = (state) => state.messages.error
export const selectTotalUnreadCount = (state) => state.messages.totalUnreadCount
export const selectTypingUsers = (conversationId) => (state) => 
  state.messages.typingUsers[conversationId] || []
export const selectOnlineUsers = (state) => state.messages.onlineUsers