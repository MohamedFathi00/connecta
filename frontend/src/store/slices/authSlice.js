import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authAPI from '../../services/authAPI'
import { clearTokenFromStorage, setTokenToStorage } from '../../utils/auth'

// إجراءات غير متزامنة
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password, twoFactorCode }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login({ email, password, twoFactorCode })
      if (response.data.token) {
        setTokenToStorage(response.data.token)
      }
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في تسجيل الدخول')
    }
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData)
      if (response.data.token) {
        setTokenToStorage(response.data.token)
      }
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في إنشاء الحساب')
    }
  }
)

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyToken()
      return response.data
    } catch (error) {
      clearTokenFromStorage()
      return rejectWithValue('انتهت صلاحية الجلسة')
    }
  }
)

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في تحديث الملف الشخصي')
    }
  }
)

export const setup2FA = createAsyncThunk(
  'auth/setup2FA',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.setup2FA()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'فشل في إعداد المصادقة الثنائية')
    }
  }
)

export const verify2FA = createAsyncThunk(
  'auth/verify2FA',
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await authAPI.verify2FA(token)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response.data.message || 'رمز التحقق غير صحيح')
    }
  }
)

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  requireTwoFactor: false,
  twoFactorSetup: null,
  loginAttempts: 0,
  maxLoginAttempts: 3,
  isAccountLocked: false,
  lastActivity: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.requireTwoFactor = false
      state.twoFactorSetup = null
      state.error = null
      state.loginAttempts = 0
      state.isAccountLocked = false
      clearTokenFromStorage()
    },
    clearError: (state) => {
      state.error = null
    },
    clearTwoFactorRequirement: (state) => {
      state.requireTwoFactor = false
    },
    updateLastActivity: (state) => {
      state.lastActivity = new Date().toISOString()
    },
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1
      if (state.loginAttempts >= state.maxLoginAttempts) {
        state.isAccountLocked = true
      }
    },
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0
      state.isAccountLocked = false
    },
    updateUserStats: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    }
  },
  extraReducers: (builder) => {
    // تسجيل الدخول
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        if (action.payload.requireTwoFactor) {
          state.requireTwoFactor = true
        } else {
          state.user = action.payload.user
          state.token = action.payload.token
          state.isAuthenticated = true
          state.loginAttempts = 0
          state.isAccountLocked = false
          state.lastActivity = new Date().toISOString()
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.loginAttempts += 1
        if (state.loginAttempts >= state.maxLoginAttempts) {
          state.isAccountLocked = true
        }
      })

    // إنشاء حساب
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.isAuthenticated = true
        state.lastActivity = new Date().toISOString()
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

    // تهيئة المصادقة
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.isAuthenticated = true
        state.lastActivity = new Date().toISOString()
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
      })

    // تحديث الملف الشخصي
    builder
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload.user }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.error = action.payload
      })

    // إعداد المصادقة الثنائية
    builder
      .addCase(setup2FA.fulfilled, (state, action) => {
        state.twoFactorSetup = action.payload
      })
      .addCase(setup2FA.rejected, (state, action) => {
        state.error = action.payload
      })

    // تفعيل المصادقة الثنائية
    builder
      .addCase(verify2FA.fulfilled, (state) => {
        if (state.user) {
          state.user.twoFactorEnabled = true
        }
        state.twoFactorSetup = null
      })
      .addCase(verify2FA.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const {
  logout,
  clearError,
  clearTwoFactorRequirement,
  updateLastActivity,
  incrementLoginAttempts,
  resetLoginAttempts,
  updateUserStats
} = authSlice.actions

export default authSlice.reducer

// Selectors
export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectIsLoading = (state) => state.auth.isLoading
export const selectAuthError = (state) => state.auth.error
export const selectRequireTwoFactor = (state) => state.auth.requireTwoFactor
export const selectTwoFactorSetup = (state) => state.auth.twoFactorSetup
export const selectIsAccountLocked = (state) => state.auth.isAccountLocked