import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

// Icons
import {
  UserIcon,
  ShieldCheckIcon,
  BellIcon,
  EyeIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  KeyIcon,
  CameraIcon,
  MapPinIcon,
  LinkIcon
} from '@heroicons/react/24/outline'

// Components
import UserAvatar from '../components/common/UserAvatar'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Switch from '../components/common/Switch'
import Select from '../components/common/Select'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'

// Redux
import { updateProfile, changePassword, deleteAccount } from '../store/slices/authSlice'
import { setTheme } from '../store/slices/themeSlice'
import { updateNotificationSettings } from '../store/slices/notificationsSlice'

const SettingsPage = () => {
  const dispatch = useDispatch()
  const { user, loading } = useSelector(state => state.auth)
  const { currentTheme } = useSelector(state => state.theme)
  const { settings: notificationSettings } = useSelector(state => state.notifications)
  
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    phone: user?.phone || ''
  })
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowMessages: 'everyone',
    allowTags: 'everyone',
    showOnlineStatus: true,
    indexProfile: true
  })
  
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: {
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
      messages: true,
      newsletter: false
    },
    push: {
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
      messages: true
    },
    inApp: {
      likes: true,
      comments: true,
      follows: true,
      mentions: true,
      messages: true
    }
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [saving, setSaving] = useState(false)

  // تحميل الإعدادات الحالية
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  // علامات التبويب
  const tabs = [
    {
      key: 'profile',
      label: 'الملف الشخصي',
      icon: UserIcon,
      description: 'المعلومات الأساسية والبيانات الشخصية'
    },
    {
      key: 'privacy',
      label: 'الخصوصية',
      icon: EyeIcon,
      description: 'إعدادات الخصوصية والأمان'
    },
    {
      key: 'notifications',
      label: 'الإشعارات',
      icon: BellIcon,
      description: 'تفضيلات الإشعارات والتنبيهات'
    },
    {
      key: 'appearance',
      label: 'المظهر',
      icon: PaintBrushIcon,
      description: 'مظهر التطبيق واللغة'
    },
    {
      key: 'security',
      label: 'الأمان',
      icon: ShieldCheckIcon,
      description: 'كلمة المرور والمصادقة الثنائية'
    },
    {
      key: 'account',
      label: 'الحساب',
      icon: ExclamationTriangleIcon,
      description: 'إدارة الحساب والبيانات'
    }
  ]

  // حفظ الملف الشخصي
  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await dispatch(updateProfile(profileData))
      toast.success('تم حفظ الملف الشخصي بنجاح')
    } catch (error) {
      toast.error('فشل في حفظ الملف الشخصي')
    } finally {
      setSaving(false)
    }
  }

  // تغيير كلمة المرور
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة')
      return
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      return
    }

    setSaving(true)
    try {
      await dispatch(changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }))
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswordModal(false)
      toast.success('تم تغيير كلمة المرور بنجاح')
    } catch (error) {
      toast.error('فشل في تغيير كلمة المرور')
    } finally {
      setSaving(false)
    }
  }

  // حذف الحساب
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'حذف حسابي') {
      toast.error('يرجى كتابة "حذف حسابي" للتأكيد')
      return
    }

    setSaving(true)
    try {
      await dispatch(deleteAccount())
      toast.success('تم حذف الحساب بنجاح')
    } catch (error) {
      toast.error('فشل في حذف الحساب')
    } finally {
      setSaving(false)
    }
  }

  // تحديث إعدادات الإشعارات
  const handleUpdateNotifications = async () => {
    setSaving(true)
    try {
      await dispatch(updateNotificationSettings(notificationPrefs))
      toast.success('تم حفظ إعدادات الإشعارات')
    } catch (error) {
      toast.error('فشل في حفظ إعدادات الإشعارات')
    } finally {
      setSaving(false)
    }
  }

  // خيارات المظهر
  const themeOptions = [
    { value: 'light', label: 'فاتح', description: 'مظهر فاتح دائماً' },
    { value: 'dark', label: 'داكن', description: 'مظهر داكن دائماً' },
    { value: 'auto', label: 'تلقائي', description: 'حسب إعدادات النظام' }
  ]

  // خيارات اللغة
  const languageOptions = [
    { value: 'ar', label: 'العربية', description: 'اللغة العربية' },
    { value: 'en', label: 'English', description: 'English Language' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        
        {/* رأس الصفحة */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            الإعدادات
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            إدارة حسابك وتخصيص تجربتك
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* قائمة علامات التبويب */}
          <div className="lg:w-80">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  أقسام الإعدادات
                </h2>
              </div>
              
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`
                      w-full flex items-center space-x-3 p-3 rounded-lg text-right transition-colors
                      ${activeTab === tab.key
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <tab.icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 text-right">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* محتوى التبويبات */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft">
              
              <AnimatePresence mode="wait">
                {/* الملف الشخصي */}
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        الملف الشخصي
                      </h2>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="btn-primary flex items-center space-x-2"
                      >
                        {saving ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <CheckIcon className="w-4 h-4" />
                        )}
                        <span>حفظ التغييرات</span>
                      </button>
                    </div>

                    {/* الصورة الشخصية */}
                    <div className="flex items-center space-x-6 mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <UserAvatar user={user} size="xxl" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          الصورة الشخصية
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          يُنصح بصورة بحجم 400x400 بكسل
                        </p>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setShowAvatarModal(true)}
                            className="btn-secondary flex items-center space-x-2"
                          >
                            <CameraIcon className="w-4 h-4" />
                            <span>تغيير الصورة</span>
                          </button>
                          <button className="btn-outline-danger">
                            حذف الصورة
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* نموذج المعلومات */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          الاسم الأول
                        </label>
                        <input
                          type="text"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            firstName: e.target.value
                          }))}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          اسم العائلة
                        </label>
                        <input
                          type="text"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            lastName: e.target.value
                          }))}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          اسم المستخدم
                        </label>
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            username: e.target.value
                          }))}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          البريد الإلكتروني
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            email: e.target.value
                          }))}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          رقم الهاتف
                        </label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            phone: e.target.value
                          }))}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          الموقع
                        </label>
                        <input
                          type="text"
                          value={profileData.location}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            location: e.target.value
                          }))}
                          className="input-field"
                          placeholder="المدينة، البلد"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          الموقع الإلكتروني
                        </label>
                        <input
                          type="url"
                          value={profileData.website}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            website: e.target.value
                          }))}
                          className="input-field"
                          placeholder="https://example.com"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          النبذة الشخصية
                        </label>
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            bio: e.target.value
                          }))}
                          rows={4}
                          maxLength={500}
                          className="input-field resize-none"
                          placeholder="اكتب نبذة عن نفسك..."
                        />
                        <div className="text-right text-sm text-gray-500 mt-1">
                          {profileData.bio.length}/500
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* إعدادات المظهر */}
                {activeTab === 'appearance' && (
                  <motion.div
                    key="appearance"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      المظهر واللغة
                    </h2>

                    <div className="space-y-8">
                      {/* مظهر التطبيق */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          مظهر التطبيق
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {themeOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => dispatch(setTheme(option.value))}
                              className={`
                                p-4 border-2 rounded-lg text-center transition-colors
                                ${currentTheme === option.value
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }
                              `}
                            >
                              <div className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                {option.label}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {option.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* اللغة */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          اللغة
                        </h3>
                        <Select
                          value="ar"
                          options={languageOptions}
                          onChange={(value) => {
                            // تطبيق تغيير اللغة
                            toast.success('سيتم تطبيق تغيير اللغة بعد إعادة التحميل')
                          }}
                          className="max-w-xs"
                        />
                      </div>

                      {/* إعدادات إضافية */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          إعدادات إضافية
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                الحركات والتأثيرات
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                تفعيل الحركات والتأثيرات البصرية
                              </div>
                            </div>
                            <Switch defaultChecked />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                الأصوات
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                تشغيل أصوات التنبيهات
                              </div>
                            </div>
                            <Switch defaultChecked />
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                الوضع المضغوط
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                عرض المزيد من المحتوى في مساحة أقل
                              </div>
                            </div>
                            <Switch />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* الأمان */}
                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      الأمان
                    </h2>

                    <div className="space-y-8">
                      {/* كلمة المرور */}
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              كلمة المرور
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              آخر تغيير: منذ 3 أشهر
                            </p>
                          </div>
                          <button
                            onClick={() => setShowPasswordModal(true)}
                            className="btn-secondary flex items-center space-x-2"
                          >
                            <KeyIcon className="w-4 h-4" />
                            <span>تغيير كلمة المرور</span>
                          </button>
                        </div>
                      </div>

                      {/* المصادقة الثنائية */}
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              المصادقة الثنائية
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {user?.twoFactorEnabled ? 'مفعلة' : 'غير مفعلة'}
                            </p>
                          </div>
                          <button className="btn-primary">
                            {user?.twoFactorEnabled ? 'إلغاء التفعيل' : 'تفعيل'}
                          </button>
                        </div>
                      </div>

                      {/* الجلسات النشطة */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          الجلسات النشطة
                        </h3>
                        <div className="space-y-3">
                          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <DevicePhoneMobileIcon className="w-6 h-6 text-gray-500" />
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    هذا الجهاز
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Chrome على Windows • نشط الآن
                                  </div>
                                </div>
                              </div>
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                نشط
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* إدارة الحساب */}
                {activeTab === 'account' && (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-6"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      إدارة الحساب
                    </h2>

                    <div className="space-y-8">
                      {/* تصدير البيانات */}
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              تصدير البيانات
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              احصل على نسخة من بياناتك
                            </p>
                          </div>
                          <button className="btn-secondary flex items-center space-x-2">
                            <ArrowPathIcon className="w-4 h-4" />
                            <span>تصدير البيانات</span>
                          </button>
                        </div>
                      </div>

                      {/* تعطيل الحساب */}
                      <div className="p-4 border border-orange-200 dark:border-orange-700 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-300">
                              تعطيل الحساب
                            </h3>
                            <p className="text-sm text-orange-700 dark:text-orange-400">
                              تعطيل مؤقت للحساب (يمكن استعادته)
                            </p>
                          </div>
                          <button className="btn-outline-warning">
                            تعطيل الحساب
                          </button>
                        </div>
                      </div>

                      {/* حذف الحساب */}
                      <div className="p-4 border border-red-200 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">
                              حذف الحساب نهائياً
                            </h3>
                            <p className="text-sm text-red-700 dark:text-red-400">
                              حذف نهائي لجميع البيانات والمحتوى
                            </p>
                          </div>
                          <button
                            onClick={() => setShowDeleteDialog(true)}
                            className="btn-outline-danger flex items-center space-x-2"
                          >
                            <TrashIcon className="w-4 h-4" />
                            <span>حذف الحساب</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* نافذة تغيير كلمة المرور */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="تغيير كلمة المرور"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              كلمة المرور الحالية
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({
                ...prev,
                currentPassword: e.target.value
              }))}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({
                ...prev,
                newPassword: e.target.value
              }))}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تأكيد كلمة المرور الجديدة
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({
                ...prev,
                confirmPassword: e.target.value
              }))}
              className="input-field"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="btn-secondary"
            >
              إلغاء
            </button>
            <button
              onClick={handleChangePassword}
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              {saving ? (
                <LoadingSpinner size="small" />
              ) : (
                <CheckIcon className="w-4 h-4" />
              )}
              <span>تغيير كلمة المرور</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* نافذة تأكيد حذف الحساب */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
        title="حذف الحساب نهائياً"
        message="هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك ومحتواك نهائياً."
        confirmText="حذف الحساب"
        type="danger"
        loading={saving}
      >
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            اكتب "حذف حسابي" للتأكيد:
          </label>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="input-field"
            placeholder="حذف حسابي"
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}

export default SettingsPage