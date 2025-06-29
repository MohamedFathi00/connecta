import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import usersAPI from '../../services/usersAPI'

// إجراءات غير متزامنة
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ page = 1, limit = 20, type = 'all' }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getUsers({ page, limit, type })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في جلب المستخدمين')
    }
  }
)

export const fetchUserProfile = createAsyncThunk(
  'users/fetchUserProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getUserProfile(userId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في جلب الملف الشخصي')
    }
  }
)

export const followUser = createAsyncThunk(
  'users/followUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await usersAPI.followUser(userId)
      return { userId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في المتابعة')
    }
  }
)

export const unfollowUser = createAsyncThunk(
  'users/unfollowUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await usersAPI.unfollowUser(userId)
      return { userId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في إلغاء المتابعة')
    }
  }
)

export const searchUsers = createAsyncThunk(
  'users/searchUsers',
  async ({ query, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.searchUsers(query, filters)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في البحث')
    }
  }
)

export const getSuggestedUsers = createAsyncThunk(
  'users/getSuggestedUsers',
  async ({ limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getSuggestedUsers(limit)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في جلب الاقتراحات')
    }
  }
)

export const blockUser = createAsyncThunk(
  'users/blockUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await usersAPI.blockUser(userId)
      return { userId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في حظر المستخدم')
    }
  }
)

export const unblockUser = createAsyncThunk(
  'users/unblockUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await usersAPI.unblockUser(userId)
      return { userId, ...response.data }
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في إلغاء الحظر')
    }
  }
)

export const reportUser = createAsyncThunk(
  'users/reportUser',
  async ({ userId, reason, description }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.reportUser(userId, { reason, description })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في إرسال البلاغ')
    }
  }
)

const initialState = {
  users: [],
  currentUserProfile: null,
  suggestedUsers: [],
  searchResults: [],
  following: [],
  followers: [],
  blockedUsers: [],
  loading: false,
  profileLoading: false,
  searchLoading: false,
  suggestionsLoading: false,
  error: null,
  hasMore: true,
  page: 1,
  totalUsers: 0,
  searchQuery: '',
  filters: {
    verified: false,
    online: false,
    location: '',
    interests: []
  }
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
    },
    clearSearchResults: (state) => {
      state.searchResults = []
      state.searchQuery = ''
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    updateUserInList: (state, action) => {
      const updateUserInArray = (array, updatedUser) => {
        const index = array.findIndex(user => user.id === updatedUser.id)
        if (index !== -1) {
          array[index] = { ...array[index], ...updatedUser }
        }
      }
      
      updateUserInArray(state.users, action.payload)
      updateUserInArray(state.searchResults, action.payload)
      updateUserInArray(state.suggestedUsers, action.payload)
      updateUserInArray(state.following, action.payload)
      updateUserInArray(state.followers, action.payload)
      
      if (state.currentUserProfile && state.currentUserProfile.id === action.payload.id) {
        state.currentUserProfile = { ...state.currentUserProfile, ...action.payload }
      }
    },
    removeUserFromSuggestions: (state, action) => {
      state.suggestedUsers = state.suggestedUsers.filter(user => user.id !== action.payload)
    },
    addToFollowing: (state, action) => {
      if (!state.following.find(user => user.id === action.payload.id)) {
        state.following.push(action.payload)
      }
    },
    removeFromFollowing: (state, action) => {
      state.following = state.following.filter(user => user.id !== action.payload)
    },
    addToBlocked: (state, action) => {
      if (!state.blockedUsers.find(user => user.id === action.payload.id)) {
        state.blockedUsers.push(action.payload)
      }
    },
    removeFromBlocked: (state, action) => {
      state.blockedUsers = state.blockedUsers.filter(user => user.id !== action.payload)
    },
    resetUsers: (state) => {
      state.users = []
      state.page = 1
      state.hasMore = true
      state.totalUsers = 0
    },
    clearCurrentProfile: (state) => {
      state.currentUserProfile = null
    }
  },
  extraReducers: (builder) => {
    // جلب المستخدمين
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        const { users, totalUsers, hasMore, page } = action.payload
        
        if (page === 1) {
          state.users = users
        } else {
          state.users = [...state.users, ...users]
        }
        
        state.totalUsers = totalUsers
        state.hasMore = hasMore
        state.page = page
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // جلب الملف الشخصي
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.profileLoading = true
        state.error = null
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false
        state.currentUserProfile = action.payload.user
        state.following = action.payload.following || []
        state.followers = action.payload.followers || []
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.profileLoading = false
        state.error = action.payload
      })

    // متابعة مستخدم
    builder
      .addCase(followUser.fulfilled, (state, action) => {
        const { userId, isFollowing, followersCount } = action.payload
        
        // تحديث المستخدم في القوائم
        const updateFollowStatus = (user) => {
          if (user.id === userId) {
            user.isFollowing = isFollowing
            user.followersCount = followersCount
          }
        }
        
        state.users.forEach(updateFollowStatus)
        state.searchResults.forEach(updateFollowStatus)
        state.suggestedUsers.forEach(updateFollowStatus)
        
        if (state.currentUserProfile && state.currentUserProfile.id === userId) {
          state.currentUserProfile.isFollowing = isFollowing
          state.currentUserProfile.followersCount = followersCount
        }
      })

    // إلغاء المتابعة
    builder
      .addCase(unfollowUser.fulfilled, (state, action) => {
        const { userId, isFollowing, followersCount } = action.payload
        
        const updateFollowStatus = (user) => {
          if (user.id === userId) {
            user.isFollowing = isFollowing
            user.followersCount = followersCount
          }
        }
        
        state.users.forEach(updateFollowStatus)
        state.searchResults.forEach(updateFollowStatus)
        state.suggestedUsers.forEach(updateFollowStatus)
        
        if (state.currentUserProfile && state.currentUserProfile.id === userId) {
          state.currentUserProfile.isFollowing = isFollowing
          state.currentUserProfile.followersCount = followersCount
        }
        
        // إزالة من قائمة المتابعين
        state.following = state.following.filter(user => user.id !== userId)
      })

    // البحث عن المستخدمين
    builder
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true
        state.error = null
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false
        state.searchResults = action.payload.users
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false
        state.error = action.payload
      })

    // الاقتراحات
    builder
      .addCase(getSuggestedUsers.pending, (state) => {
        state.suggestionsLoading = true
        state.error = null
      })
      .addCase(getSuggestedUsers.fulfilled, (state, action) => {
        state.suggestionsLoading = false
        state.suggestedUsers = action.payload.users
      })
      .addCase(getSuggestedUsers.rejected, (state, action) => {
        state.suggestionsLoading = false
        state.error = action.payload
      })

    // حظر المستخدم
    builder
      .addCase(blockUser.fulfilled, (state, action) => {
        const { userId } = action.payload
        
        // إزالة من جميع القوائم
        state.users = state.users.filter(user => user.id !== userId)
        state.following = state.following.filter(user => user.id !== userId)
        state.followers = state.followers.filter(user => user.id !== userId)
        state.suggestedUsers = state.suggestedUsers.filter(user => user.id !== userId)
        
        // إضافة إلى قائمة المحظورين
        const blockedUser = state.searchResults.find(user => user.id === userId)
        if (blockedUser) {
          state.blockedUsers.push(blockedUser)
        }
      })

    // إلغاء الحظر
    builder
      .addCase(unblockUser.fulfilled, (state, action) => {
        const { userId } = action.payload
        state.blockedUsers = state.blockedUsers.filter(user => user.id !== userId)
      })
  },
})

export const {
  clearError,
  setSearchQuery,
  clearSearchResults,
  setFilters,
  updateUserInList,
  removeUserFromSuggestions,
  addToFollowing,
  removeFromFollowing,
  addToBlocked,
  removeFromBlocked,
  resetUsers,
  clearCurrentProfile
} = usersSlice.actions

export default usersSlice.reducer

// Selectors
export const selectUsers = (state) => state.users.users
export const selectCurrentUserProfile = (state) => state.users.currentUserProfile
export const selectSuggestedUsers = (state) => state.users.suggestedUsers
export const selectSearchResults = (state) => state.users.searchResults
export const selectFollowing = (state) => state.users.following
export const selectFollowers = (state) => state.users.followers
export const selectBlockedUsers = (state) => state.users.blockedUsers
export const selectUsersLoading = (state) => state.users.loading
export const selectProfileLoading = (state) => state.users.profileLoading
export const selectSearchLoading = (state) => state.users.searchLoading
export const selectUsersError = (state) => state.users.error
export const selectHasMoreUsers = (state) => state.users.hasMore
export const selectUsersFilters = (state) => state.users.filters