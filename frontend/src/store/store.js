import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'

// Slices
import authSlice from './slices/authSlice'
import themeSlice from './slices/themeSlice'
import postsSlice from './slices/postsSlice'
import usersSlice from './slices/usersSlice'
import notificationsSlice from './slices/notificationsSlice'
import messagesSlice from './slices/messagesSlice'
import uiSlice from './slices/uiSlice'

// إعداد المثابرة
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'theme'], // البيانات التي نريد حفظها
  blacklist: ['ui', 'posts'] // البيانات التي لا نريد حفظها
}

const rootReducer = combineReducers({
  auth: authSlice,
  theme: themeSlice,
  posts: postsSlice,
  users: usersSlice,
  notifications: notificationsSlice,
  messages: messagesSlice,
  ui: uiSlice,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch