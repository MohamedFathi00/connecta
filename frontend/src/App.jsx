import React, { Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import ExplorePage from './pages/ExplorePage'
import MessagesPage from './pages/MessagesPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'

// Components
import LoadingSpinner from './components/common/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Layout from './components/layout/Layout'
import PWAInstallPrompt from './components/common/PWAInstallPrompt'

// Redux
import { initializeAuth } from './store/slices/authSlice'
import { setTheme } from './store/slices/themeSlice'

// Utils
import { getStoredTheme } from './utils/theme'

// Lazy loading للصفحات الثانوية
const ARCameraPage = React.lazy(() => import('./pages/ARCameraPage'))
const LiveStreamPage = React.lazy(() => import('./pages/LiveStreamPage'))
const AdminPage = React.lazy(() => import('./pages/admin/AdminPage'))
const PostDetailsPage = React.lazy(() => import('./pages/PostDetailsPage'))
const UserListPage = React.lazy(() => import('./pages/UserListPage'))

function App() {
  const dispatch = useDispatch()
  const { isAuthenticated, isLoading } = useSelector(state => state.auth)
  const { currentTheme } = useSelector(state => state.theme)

  // تهيئة التطبيق
  useEffect(() => {
    // تهيئة المصادقة
    dispatch(initializeAuth())
    
    // تطبيق المظهر المحفوظ
    const storedTheme = getStoredTheme()
    if (storedTheme) {
      dispatch(setTheme(storedTheme))
    }
    
    // تطبيق المظهر الداكن على HTML
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [dispatch, currentTheme])

  // عرض شاشة التحميل أثناء التهيئة
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <motion.p 
            className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            جارٍ تحميل منصة التواصل...
          </motion.p>
        </div>
      </div>
    )
  }

  return (
    <div className="App min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <AnimatePresence mode="wait">
        <Routes>
          {/* الصفحات العامة */}
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <LoginPage />
                </motion.div>
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          
          <Route 
            path="/register" 
            element={
              !isAuthenticated ? (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <RegisterPage />
                </motion.div>
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* الصفحات المحمية */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/explore" element={<ExplorePage />} />
                    <Route path="/messages/*" element={<MessagesPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/profile/:userId?" element={<ProfilePage />} />
                    <Route path="/settings/*" element={<SettingsPage />} />
                    <Route path="/users/:type" element={<UserListPage />} />
                    
                    {/* صفحات بـ Lazy Loading */}
                    <Route 
                      path="/post/:postId" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <PostDetailsPage />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="/ar-camera" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <ARCameraPage />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="/live/:streamId?" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <LiveStreamPage />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="/admin/*" 
                      element={
                        <Suspense fallback={<LoadingSpinner />}>
                          <AdminPage />
                        </Suspense>
                      } 
                    />
                    
                    {/* صفحة 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
      
      {/* مكونات إضافية */}
      <PWAInstallPrompt />
      
      {/* رسائل التطوير */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 rounded shadow-lg text-xs">
            <p className="font-bold">وضع التطوير</p>
            <p>المشروع قيد التطوير</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App