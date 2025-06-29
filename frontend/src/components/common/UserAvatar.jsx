import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'

const UserAvatar = ({ 
  user, 
  size = 'medium',
  showOnline = false,
  showVerified = true,
  onClick = null,
  className = '',
  animate = true
}) => {
  const [imageError, setImageError] = useState(false)
  
  const sizeClasses = {
    xs: 'w-6 h-6',
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12',
    xl: 'w-16 h-16',
    xxl: 'w-20 h-20',
    xxxl: 'w-24 h-24'
  }
  
  const onlineIndicatorSizes = {
    xs: 'w-1.5 h-1.5',
    small: 'w-2 h-2',
    medium: 'w-2.5 h-2.5',
    large: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    xxl: 'w-4 h-4',
    xxxl: 'w-5 h-5'
  }
  
  const verifiedIconSizes = {
    xs: 'w-3 h-3',
    small: 'w-3.5 h-3.5',
    medium: 'w-4 h-4',
    large: 'w-5 h-5',
    xl: 'w-6 h-6',
    xxl: 'w-7 h-7',
    xxxl: 'w-8 h-8'
  }

  // إعداد الألوان حسب المظهر
  const getInitialsBackground = () => {
    if (!user?.firstName) return 'bg-gray-400'
    
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ]
    
    const charCode = user.firstName.charCodeAt(0) + (user.lastName?.charCodeAt(0) || 0)
    return colors[charCode % colors.length]
  }

  // الحصول على الأحرف الأولى
  const getInitials = () => {
    if (!user?.firstName) return '?'
    
    const first = user.firstName.charAt(0).toUpperCase()
    const last = user.lastName ? user.lastName.charAt(0).toUpperCase() : ''
    return first + last
  }

  const AvatarContent = () => (
    <div className="relative group">
      <motion.div
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          overflow-hidden 
          border-2 
          border-white 
          dark:border-gray-700 
          shadow-md
          relative
          ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-offset-2' : ''}
          ${className}
        `}
        whileHover={animate && onClick ? { scale: 1.05 } : {}}
        whileTap={animate && onClick ? { scale: 0.95 } : {}}
        onClick={onClick}
      >
        {user?.avatar && !imageError ? (
          <img
            src={user.avatar}
            alt={`${user.firstName} ${user.lastName}`}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-white font-semibold ${getInitialsBackground()}`}>
            <span className={`${
              size === 'xs' ? 'text-xs' :
              size === 'small' ? 'text-sm' :
              size === 'medium' ? 'text-sm' :
              size === 'large' ? 'text-base' :
              size === 'xl' ? 'text-lg' :
              size === 'xxl' ? 'text-xl' :
              'text-2xl'
            }`}>
              {getInitials()}
            </span>
          </div>
        )}

        {/* مؤشر الحالة الآن/عدم الاتصال */}
        {showOnline && (
          <div className={`
            absolute -bottom-0.5 -right-0.5 
            ${onlineIndicatorSizes[size]} 
            rounded-full 
            border-2 
            border-white 
            dark:border-gray-800
            ${user?.isOnline ? 'bg-green-500' : 'bg-gray-400'}
          `} />
        )}
      </motion.div>

      {/* علامة التوثيق */}
      {showVerified && user?.isVerified && (
        <motion.div
          className="absolute -top-1 -right-1 z-10"
          initial={animate ? { scale: 0 } : {}}
          animate={animate ? { scale: 1 } : {}}
          transition={{ delay: 0.2, type: "spring", stiffness: 500, damping: 30 }}
        >
          <CheckBadgeIcon className={`${verifiedIconSizes[size]} text-blue-500 bg-white dark:bg-gray-800 rounded-full`} />
        </motion.div>
      )}

      {/* تأثير hover للمعلومات */}
      {onClick && (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center">
          <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            عرض الملف
          </span>
        </div>
      )}
    </div>
  )

  return <AvatarContent />
}

// مكون أفاتار متعدد للمجموعات
export const GroupAvatar = ({ users = [], size = 'medium', maxShow = 3, className = '' }) => {
  const displayUsers = users.slice(0, maxShow)
  const remainingCount = users.length - maxShow

  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-10 h-10'
  }

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {displayUsers.map((user, index) => (
        <div key={user.id || index} className="relative">
          <UserAvatar 
            user={user} 
            size={size}
            className="ring-2 ring-white dark:ring-gray-800"
          />
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div className={`
          ${sizeClasses[size]} 
          bg-gray-100 
          dark:bg-gray-700 
          border-2 
          border-white 
          dark:border-gray-800 
          rounded-full 
          flex 
          items-center 
          justify-center
          text-xs
          font-medium
          text-gray-600
          dark:text-gray-300
        `}>
          +{remainingCount}
        </div>
      )}
    </div>
  )
}

// مكون أفاتار مع قصة
export const StoryAvatar = ({ user, hasStory = false, hasViewedStory = false, onClick, size = 'large' }) => {
  return (
    <motion.div
      className="relative cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div className={`
        p-0.5 rounded-full 
        ${hasStory 
          ? hasViewedStory 
            ? 'bg-gray-300 dark:bg-gray-600' 
            : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600'
          : 'bg-transparent'
        }
      `}>
        <UserAvatar 
          user={user} 
          size={size}
          showOnline={false}
          className="ring-2 ring-white dark:ring-gray-900"
        />
      </div>
      
      {hasStory && (
        <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200" />
      )}
    </motion.div>
  )
}

export default UserAvatar