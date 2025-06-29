import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CogIcon,
  ShieldCheckIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  PhotoIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ChevronLeftIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

const AdminSidebar = () => {
  const location = useLocation()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const menuItems = [
    {
      title: 'نظرة عامة',
      items: [
        {
          name: 'لوحة التحكم',
          href: '/admin',
          icon: ChartBarIcon,
          badge: null
        },
        {
          name: 'الإحصائيات',
          href: '/admin/analytics',
          icon: ChartBarIcon,
          badge: null
        }
      ]
    },
    {
      title: 'إدارة المحتوى',
      items: [
        {
          name: 'المستخدمون',
          href: '/admin/users',
          icon: UsersIcon,
          badge: '1.2k'
        },
        {
          name: 'المنشورات',
          href: '/admin/posts',
          icon: DocumentTextIcon,
          badge: '856'
        },
        {
          name: 'الوسائط',
          href: '/admin/media',
          icon: PhotoIcon,
          badge: null
        },
        {
          name: 'الرسائل',
          href: '/admin/messages',
          icon: ChatBubbleLeftRightIcon,
          badge: null
        }
      ]
    },
    {
      title: 'الأمان والرقابة',
      items: [
        {
          name: 'البلاغات',
          href: '/admin/reports',
          icon: ExclamationTriangleIcon,
          badge: '12'
        },
        {
          name: 'الإشراف',
          href: '/admin/moderation',
          icon: ShieldCheckIcon,
          badge: '5'
        },
        {
          name: 'الإشعارات',
          href: '/admin/notifications',
          icon: BellIcon,
          badge: null
        }
      ]
    },
    {
      title: 'الإعدادات',
      items: [
        {
          name: 'إعدادات عامة',
          href: '/admin/settings',
          icon: CogIcon,
          badge: null
        },
        {
          name: 'إدارة النظام',
          href: '/admin/system',
          icon: GlobeAltIcon,
          badge: null
        },
        {
          name: 'الإيرادات',
          href: '/admin/revenue',
          icon: CurrencyDollarIcon,
          badge: null
        }
      ]
    }
  ]

  const isActive = (href) => {
    if (href === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <>
      {/* زر القائمة للأجهزة المحمولة */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Overlay للأجهزة المحمولة */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* الشريط الجانبي */}
      <motion.div
        className={`
          fixed lg:relative inset-y-0 right-0 z-50
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out
          flex flex-col h-full
        `}
        initial={false}
        animate={{
          width: isCollapsed ? 64 : 256
        }}
      >
        {/* رأس الشريط الجانبي */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                لوحة الإدارة
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            {/* زر إغلاق للموبايل */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            
            {/* زر طي الشريط الجانبي */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeftIcon 
                className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
              />
            </button>
          </div>
        </div>

        {/* العودة للموقع الرئيسي */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Link
            to="/"
            className={`
              flex items-center space-x-3 p-2 rounded-lg
              text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <HomeIcon className="w-5 h-5" />
            {!isCollapsed && <span className="text-sm">العودة للموقع</span>}
          </Link>
        </div>

        {/* القائمة الجانبية */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-2">
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center space-x-3 p-3 rounded-lg transition-colors
                      ${isActive(item.href)
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-4 border-blue-600'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    
                    {!isCollapsed && (
                      <>
                        <span className="font-medium">{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* معلومات النظام */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">حالة النظام</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 dark:text-green-400 text-xs">نشط</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">الإصدار</span>
                <span className="text-gray-900 dark:text-white text-xs">v1.0.0</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">المستخدمون النشطون</span>
                <span className="text-gray-900 dark:text-white text-xs">1,234</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}

export default AdminSidebar