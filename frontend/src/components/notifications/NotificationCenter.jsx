import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

// Icons
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  Cog6ToothIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  UserPlusIcon,
  PhotoIcon,
  VideoCameraIcon,
  GiftIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline'

// Components
import UserAvatar from '../common/UserAvatar'
import LoadingSpinner from '../common/LoadingSpinner'
import EmptyState from '../common/EmptyState'

// Redux
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  updateNotificationSettings
} from '../../store/slices/notificationsSlice'

// Utils
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

const NotificationCenter = ({ isOpen, onClose }) => {
  const dispatch = useDispatch()
  const { 
    notifications, 
    unreadCount, 
    loading,
    settings 
  } = useSelector(state => state.notifications)

  const [activeTab, setActiveTab] = useState('all')
  const [selectedNotifications, setSelectedNotifications] = useState(new Set())
  const [showSettings, setShowSettings] = useState(false)
  const [filter, setFilter] = useState('all') // all, unread, read

  // جلب الإشعارات عند فتح المركز
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications({ page: 1, limit: 50 }))
    }
  }, [isOpen, dispatch])

  const tabs = [
    { key: 'all', label: 'الكل', count: notifications.length },
    { key: 'mentions', label: 'الإشارات', count: notifications.filter(n => n.type === 'mention').length },
    { key: 'likes', label: 'الإعجابات', count: notifications.filter(n => n.type === 'like').length },
    { key: 'follows', label: 'المتابعون', count: notifications.filter(n => n.type === 'follow').length },
    { key: 'comments', label: 'التعليقات', count: notifications.filter(n => n.type === 'comment').length }
  ]

  // أيقونات الإشعارات
  const getNotificationIcon = (type) => {
    const icons = {
      like: HeartIcon,
      comment: ChatBubbleLeftIcon,
      follow: UserPlusIcon,
      mention: '@',
      post: PhotoIcon,
      story: VideoCameraIcon,
      gift: GiftIcon,
      warning: ExclamationTriangleIcon,
      info: InformationCircleIcon,
      success: CheckCircleIcon
    }
    return icons[type] || BellIcon
  }

  // ألوان الإشعارات
  const getNotificationColor = (type) => {
    const colors = {
      like: 'text-red-500 bg-red-50 dark:bg-red-900/20',
      comment: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      follow: 'text-green-500 bg-green-50 dark:bg-green-900/20',
      mention: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
      post: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
      story: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20',
      gift: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      warning: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
      info: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
      success: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
    }
    return colors[type] || 'text-gray-500 bg-gray-50 dark:bg-gray-900/20'
  }

  // فلترة الإشعارات
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab !== 'all' && notification.type !== activeTab.slice(0, -1)) {
      return false
    }
    
    if (filter === 'unread' && notification.isRead) {
      return false
    }
    
    if (filter === 'read' && !notification.isRead) {
      return false
    }
    
    return true
  })

  // تحديد إشعار كمقروء
  const handleMarkAsRead = async (notificationId) => {
    try {
      await dispatch(markAsRead(notificationId))
    } catch (error) {
      toast.error('فشل في تحديد الإشعار كمقروء')
    }
  }

  // تحديد جميع الإشعارات كمقروءة
  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead())
      toast.success('تم تحديد جميع الإشعارات كمقروءة')
    } catch (error) {
      toast.error('فشل في تحديد الإشعارات كمقروءة')
    }
  }

  // حذف إشعار
  const handleDeleteNotification = async (notificationId) => {
    try {
      await dispatch(deleteNotification(notificationId))
      toast.success('تم حذف الإشعار')
    } catch (error) {
      toast.error('فشل في حذف الإشعار')
    }
  }

  // حذف الإشعارات المحددة
  const handleDeleteSelected = async () => {
    try {
      for (const notificationId of selectedNotifications) {
        await dispatch(deleteNotification(notificationId))
      }
      setSelectedNotifications(new Set())
      toast.success(`تم حذف ${selectedNotifications.size} إشعار`)
    } catch (error) {
      toast.error('فشل في حذف الإشعارات')
    }
  }

  // حذف جميع الإشعارات
  const handleDeleteAll = async () => {
    try {
      await dispatch(deleteAllNotifications())
      toast.success('تم حذف جميع الإشعارات')
    } catch (error) {
      toast.error('فشل في حذف الإشعارات')
    }
  }

  // تحديد/إلغاء تحديد إشعار
  const toggleSelectNotification = (notificationId) => {
    const newSelected = new Set(selectedNotifications)
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId)
    } else {
      newSelected.add(notificationId)
    }
    setSelectedNotifications(newSelected)
  }

  // تحديد/إلغاء تحديد الكل
  const toggleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set())
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)))
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* الخلفية المظلمة */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* مركز الإشعارات */}
      <motion.div
        className="absolute top-0 left-0 w-full max-w-md h-full bg-white dark:bg-gray-900 shadow-2xl"
        initial={{ x: -400 }}
        animate={{ x: 0 }}
        exit={{ x: -400 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <div className="flex flex-col h-full">
          
          {/* رأس مركز الإشعارات */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <BellIcon className="w-6 h-6 text-gray-900 dark:text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  الإشعارات
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
                    {unreadCount} جديد
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Cog6ToothIcon className="w-5 h-5 text-gray-500" />
                </button>
                
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* علامات التبويب */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors
                    ${activeTab === tab.key
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="mr-1 text-xs">({tab.count})</span>
                  )}
                </button>
              ))}
            </div>

            {/* فلاتر وأدوات */}
            <div className="flex items-center justify-between mt-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800"
              >
                <option value="all">جميع الإشعارات</option>
                <option value="unread">غير مقروءة</option>
                <option value="read">مقروءة</option>
              </select>
              
              {selectedNotifications.size > 0 ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedNotifications.size} محدد
                  </span>
                  <button
                    onClick={handleDeleteSelected}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      تحديد الكل كمقروء
                    </button>
                  )}
                  
                  <button
                    onClick={toggleSelectAll}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
                  >
                    {selectedNotifications.size === filteredNotifications.length ? 'إلغاء الكل' : 'تحديد الكل'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* قائمة الإشعارات */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4">
                <LoadingSpinner text="جاري تحميل الإشعارات..." />
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type)
                  const colorClass = getNotificationColor(notification.type)
                  const isSelected = selectedNotifications.has(notification.id)
                  
                  return (
                    <motion.div
                      key={notification.id}
                      className={`
                        p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative
                        ${!notification.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                        ${isSelected ? 'bg-blue-100 dark:bg-blue-900/20' : ''}
                      `}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-start space-x-3">
                        
                        {/* تحديد */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectNotification(notification.id)}
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />

                        {/* أيقونة الإشعار */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                          {typeof Icon === 'string' ? (
                            <span className="text-lg font-bold">{Icon}</span>
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>

                        {/* أفاتار المرسل */}
                        {notification.sender && (
                          <UserAvatar user={notification.sender} size="small" />
                        )}

                        {/* محتوى الإشعار */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900 dark:text-white">
                                <span className="font-medium">
                                  {notification.sender?.firstName} {notification.sender?.lastName}
                                </span>
                                {' '}
                                <span>{notification.title}</span>
                              </p>
                              
                              {notification.body && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {notification.body}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                  <ClockIcon className="w-3 h-3 ml-1" />
                                  {formatDistanceToNow(new Date(notification.createdAt), { 
                                    addSuffix: true, 
                                    locale: ar 
                                  })}
                                </span>
                                
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </div>
                            </div>
                            
                            {/* أدوات الإشعار */}
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                  title="تحديد كمقروء"
                                >
                                  <CheckIcon className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                title="حذف"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* مؤشر عدم القراءة */}
                      {!notification.isRead && (
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="p-4">
                <EmptyState
                  icon="🔔"
                  title="لا توجد إشعارات"
                  description={
                    filter === 'unread' 
                      ? "جميع الإشعارات مقروءة"
                      : activeTab === 'all'
                      ? "لا توجد إشعارات بعد"
                      : `لا توجد إشعارات من نوع ${tabs.find(t => t.key === activeTab)?.label}`
                  }
                  size="small"
                />
              </div>
            )}
          </div>

          {/* إعدادات الإشعارات */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              >
                <div className="p-4 space-y-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    إعدادات الإشعارات
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        إشعارات الإعجابات
                      </span>
                      <input
                        type="checkbox"
                        checked={settings?.likes || true}
                        onChange={(e) => dispatch(updateNotificationSettings({
                          ...settings,
                          likes: e.target.checked
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        إشعارات التعليقات
                      </span>
                      <input
                        type="checkbox"
                        checked={settings?.comments || true}
                        onChange={(e) => dispatch(updateNotificationSettings({
                          ...settings,
                          comments: e.target.checked
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        إشعارات المتابعة
                      </span>
                      <input
                        type="checkbox"
                        checked={settings?.follows || true}
                        onChange={(e) => dispatch(updateNotificationSettings({
                          ...settings,
                          follows: e.target.checked
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                  
                  <button
                    onClick={handleDeleteAll}
                    className="w-full py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    حذف جميع الإشعارات
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default NotificationCenter