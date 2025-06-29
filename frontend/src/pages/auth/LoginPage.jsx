import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

// Components
import LoadingSpinner from '../../components/common/LoadingSpinner'
import TwoFactorModal from '../../components/auth/TwoFactorModal'

// Redux
import { loginUser, clearError } from '../../store/slices/authSlice'

// Icons
import { 
  EyeIcon, 
  EyeSlashIcon, 
  LockClosedIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon 
} from '@heroicons/react/24/outline'

const LoginPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, error, requireTwoFactor, isAccountLocked } = useSelector(state => state.auth)
  
  const [showPassword, setShowPassword] = useState(false)
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false)
  const [loginData, setLoginData] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm()

  const watchedEmail = watch('email')

  const onSubmit = async (data) => {
    try {
      dispatch(clearError())
      const result = await dispatch(loginUser(data))
      
      if (loginUser.fulfilled.match(result)) {
        if (result.payload.requireTwoFactor) {
          setLoginData(data)
          setShowTwoFactorModal(true)
        } else {
          toast.success('مرحباً بك! تم تسجيل الدخول بنجاح')
          navigate('/', { replace: true })
        }
      } else {
        toast.error(result.payload || 'فشل في تسجيل الدخول')
      }
    } catch (error) {
      toast.error('حدث خطأ غير متوقع')
    }
  }

  const handleTwoFactorSuccess = () => {
    setShowTwoFactorModal(false)
    toast.success('تم تسجيل الدخول بنجاح')
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex">
      {/* الجانب الأيسر - صورة الخلفية */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              منصة التواصل
              <br />
              <span className="text-yellow-300">المتقدمة</span>
            </h1>
            <p className="text-xl mb-8 text-blue-100 leading-relaxed">
              تواصل مع الأصدقاء، شارك اللحظات المميزة، 
              واستكشف عالماً جديداً من التفاعل الذكي
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  🤖
                </div>
                <div>
                  <h3 className="font-semibold">الذكاء الاصطناعي</h3>
                  <p className="text-blue-100 text-sm">محتوى مخصص وتوصيات ذكية</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  🥽
                </div>
                <div>
                  <h3 className="font-semibold">الواقع المعزز</h3>
                  <p className="text-blue-100 text-sm">فلاتر وتأثيرات مبتكرة</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  🔒
                </div>
                <div>
                  <h3 className="font-semibold">أمان متقدم</h3>
                  <p className="text-blue-100 text-sm">حماية كاملة لخصوصيتك</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* تأثيرات بصرية */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-purple-400 bg-opacity-20 rounded-full blur-2xl"></div>
      </div>

      {/* الجانب الأيمن - نموذج تسجيل الدخول */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <motion.div 
          className="max-w-md w-full space-y-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <motion.div
              className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              📱
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              مرحباً بعودتك
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              سجل دخولك للمتابعة
            </p>
          </div>

          {isAccountLocked && (
            <motion.div
              className="bg-red-50 border border-red-200 rounded-lg p-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center">
                <LockClosedIcon className="w-5 h-5 text-red-500 ml-2" />
                <p className="text-red-800 text-sm">
                  تم قفل الحساب مؤقتاً بسبب محاولات دخول متعددة خاطئة
                </p>
              </div>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('email', {
                    required: 'البريد الإلكتروني مطلوب',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'البريد الإلكتروني غير صحيح'
                    }
                  })}
                  type="email"
                  className="input-field pr-10"
                  placeholder="أدخل بريدك الإلكتروني"
                  disabled={isLoading || isAccountLocked}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('password', {
                    required: 'كلمة المرور مطلوبة',
                    minLength: {
                      value: 6,
                      message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-10 pl-10"
                  placeholder="أدخل كلمة المرور"
                  disabled={isLoading || isAccountLocked}
                />
                <button
                  type="button"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="mr-2 block text-sm text-gray-900 dark:text-gray-300">
                  تذكرني
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || isAccountLocked}
              className={`w-full btn-primary flex items-center justify-center ${
                isLoading || isAccountLocked ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="small" className="ml-2" />
                  جارٍ تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </motion.button>

            {error && (
              <motion.div
                className="bg-red-50 border border-red-200 rounded-lg p-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-red-800 text-sm text-center">{error}</p>
              </motion.div>
            )}
          </form>

          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              ليس لديك حساب؟{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                إنشاء حساب جديد
              </Link>
            </p>
          </div>

          {/* روابط إضافية */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <Link to="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">
                سياسة الخصوصية
              </Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">
                شروط الاستخدام
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* نافذة المصادقة الثنائية */}
      <TwoFactorModal
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
        onSuccess={handleTwoFactorSuccess}
        email={watchedEmail}
        loginData={loginData}
      />
    </div>
  )
}

export default LoginPage