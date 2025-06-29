import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

// Icons
import {
  HomeIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  BookmarkIcon,
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

import {
  HomeIcon as HomeSolid,
  BellIcon as BellSolid,
  ChatBubbleLeftRightIcon as ChatSolid,
  UserIcon as UserSolid
} from '@heroicons/react/24/solid'

// Components
import UserAvatar from '../common/UserAvatar'
import { InteractionButtonWithBadge } from '../common/InteractionButton'
import SearchModal from '../modals/SearchModal'
import ThemeSelector from '../common/ThemeSelector'

// Redux
import { logout } from '../../store/slices/authSlice'
import { setTheme } from '../../store/slices/themeSlice'
import { setSidebarOpen } from '../../store/slices/uiSlice'

// Hooks
import { useTheme } from '../../context/ThemeContext'

const Navigation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  const { user } = useSelector(state => state.auth)
  const { unreadCount } = useSelector(state => state.notifications)
  const { totalUnreadCount } = useSelector(state => state.messages)
  const { sidebarOpen, isMobile } = useSelector(state => state.ui)
  const { currentTheme, isDarkMode } = useTheme()
  
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // إغلاق القوائم المنسدلة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-menu')) {
        setShowProfileMenu(false)
        setShowThemeSelector(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // تسجيل الخروج
  const handleLogout = async () => {
    try {
      await dispatch(logout())
      toast.success('تم تسجيل الخروج بنجاح')
      navigate('/login')
    } catch (error) {
      toast.error('خطأ في تسجيل الخروج')
    }
  }

  // تبديل الشريط الجانبي
  const toggleSidebar = () => {
    dispatch(setSidebarOpen(!sidebarOpen))
  }

  // تبديل المظهر
  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    dispatch(setTheme(newTheme))
  }

  // قائمة التنقل الرئيسية
  const navigationItems = [
    {
      name: 'الرئيسية',
      href: '/',
      icon: HomeIcon,
      activeIcon: HomeSolid,
      badge: null
    },
    {
      name: 'البحث',
      href: '/search',
      icon: MagnifyingGlassIcon,
      activeIcon: MagnifyingGlassIcon,
      onClick: () => setShowSearchModal(true)
    },
    {
      name: 'الإشعارات',
      href: '/notifications',
      icon: BellIcon,
      activeIcon: BellSolid,
      badge: unreadCount
    },
    {
      name: 'الرسائل',
      href: '/messages',
      icon: ChatBubbleLeftRightIcon,
      activeIcon: ChatSolid,
      badge: totalUnreadCount
    },
    {
      name: 'المحفوظات',
      href: '/bookmarks',
      icon: BookmarkIcon,
      activeIcon: BookmarkIcon
    },
    {
      name: 'الأشخاص',
      href: '/people',
      icon: UsersIcon,
      activeIcon: UsersIcon
    },
    {
      name: 'الملف الشخصي',
      href: `/profile/${user?.username}`,
      icon: UserIcon,
      activeIcon: UserSolid
    }
  ]

  // إعدادات إضافية
  const settingsItems = [
    {
      name: 'الإعدادات',
      href: '/settings',
      icon: Cog6ToothIcon
    },
    {
      name: 'الإحصائيات',
      href: '/analytics',
      icon: ChartBarIcon
    }
  ]

  // تحديد العنصر النشط
  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <>
      {/* شريط التنقل العلوي للأجهزة المحمولة */}
      {isMobile && (
        <motion.header 
          className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">📱</span>
                </div>
                <span className="font-bold text-xl text-gray-900 dark:text-white">
                  منصة التواصل
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              <InteractionButtonWithBadge
                icon={BellIcon}
                label="الإشعارات"
                count={unreadCount}
                onClick={() => navigate('/notifications')}
              />
              
              <InteractionButtonWithBadge
                icon={ChatBubbleLeftRightIcon}
                label="الرسائل"
                count={totalUnreadCount}
                onClick={() => navigate('/messages')}
              />
              
              <UserAvatar 
                user={user} 
                size="small"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              />
            </div>
          </div>
        </motion.header>
      )}

      {/* الشريط الجانبي */}
      <AnimatePresence>
        {(sidebarOpen || !isMobile) && (
          <motion.nav
            className={`
              fixed left-0 top-0 h-full z-40 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg
              ${isMobile ? 'w-80' : 'w-64'}
            `}
            initial={isMobile ? { x: -320 } : false}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -320 } : false}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex flex-col h-full">
              {/* رأس الشريط الجانبي */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <Link to="/" className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">📱</span>
                  </div>
                  <span className="font-bold text-xl text-gray-900 dark:text-white">
                    منصة التواصل
                  </span>
                </Link>
                
                {isMobile && (
                  <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* معلومات المستخدم */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <UserAvatar user={user} size="large" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      @{user?.username}
                    </p>
                  </div>
                </div>
                
                {/* إحصائيات المستخدم */}
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {user?.postsCount || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      منشور
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {user?.followersCount || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      متابع
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {user?.followingCount || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      متابَع
                    </div>
                  </div>
                </div>
              </div>

              {/* قائمة التنقل */}
              <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                  {navigationItems.map((item) => {
                    const Icon = isActive(item.href) ? item.activeIcon : item.icon
                    const active = isActive(item.href)
                    
                    return (
                      <motion.div key={item.name}>
                        {item.onClick ? (
                          <button
                            onClick={item.onClick}
                            className={`
                              w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-right
                              transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800
                              ${active 
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600' 
                                : 'text-gray-700 dark:text-gray-300'
                              }
                            `}
                          >
                            <Icon className="w-6 h-6 flex-shrink-0" />
                            <span className="font-medium">{item.name}</span>
                            {item.badge > 0 && (
                              <span className="mr-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            )}
                          </button>
                        ) : (
                          <Link
                            to={item.href}
                            className={`
                              flex items-center space-x-3 px-3 py-3 rounded-lg
                              transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800
                              ${active 
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600' 
                                : 'text-gray-700 dark:text-gray-300'
                              }
                            `}
                          >
                            <Icon className="w-6 h-6 flex-shrink-0" />
                            <span className="font-medium">{item.name}</span>
                            {item.badge > 0 && (
                              <span className="mr-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                                {item.badge > 99 ? '99+' : item.badge}
                              </span>
                            )}
                          </Link>
                        )}
                      </motion.div>
                    )
                  })}
                </nav>

                {/* فاصل */}
                <div className="my-6 border-t border-gray-200 dark:border-gray-700"></div>

                {/* إعدادات إضافية */}
                <nav className="space-y-1 px-3">
                  {settingsItems.map((item) => {
                    const active = isActive(item.href)
                    
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`
                          flex items-center space-x-3 px-3 py-3 rounded-lg
                          transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800
                          ${active 
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                            : 'text-gray-700 dark:text-gray-300'
                          }
                        `}
                      >
                        <item.icon className="w-6 h-6 flex-shrink-0" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* أسفل الشريط الجانبي */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                {/* مبدل المظهر */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    المظهر
                  </span>
                  <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => dispatch(setTheme('light'))}
                      className={`p-1 rounded ${currentTheme === 'light' ? 'bg-white shadow-sm' : ''}`}
                    >
                      <SunIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => dispatch(setTheme('auto'))}
                      className={`p-1 rounded ${currentTheme === 'auto' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                    >
                      <ComputerDesktopIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => dispatch(setTheme('dark'))}
                      className={`p-1 rounded ${currentTheme === 'dark' ? 'bg-gray-700 shadow-sm' : ''}`}
                    >
                      <MoonIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* تسجيل الخروج */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="w-6 h-6" />
                  <span className="font-medium">تسجيل الخروج</span>
                </button>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Overlay للأجهزة المحمولة */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* نافذة البحث */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </>
  )
}

export default Navigation