import React from 'react'
import { motion } from 'framer-motion'

const InteractionButton = ({
  icon: Icon,
  label,
  count = 0,
  active = false,
  loading = false,
  disabled = false,
  onClick,
  activeColor = 'text-blue-500',
  size = 'medium',
  showCount = true,
  className = ''
}) => {
  const sizeClasses = {
    small: {
      button: 'px-2 py-1',
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    medium: {
      button: 'px-3 py-2',
      icon: 'w-5 h-5',
      text: 'text-sm'
    },
    large: {
      button: 'px-4 py-2',
      icon: 'w-6 h-6',
      text: 'text-base'
    }
  }

  const formatCount = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'م'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'ك'
    }
    return num.toString()
  }

  return (
    <motion.button
      className={`
        flex items-center space-x-2 rounded-lg
        transition-all duration-200
        hover:bg-gray-100 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${sizeClasses[size].button}
        ${active ? activeColor : 'text-gray-600 dark:text-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      initial={false}
      animate={active ? { 
        scale: [1, 1.1, 1],
        transition: { duration: 0.3 }
      } : {}}
    >
      {/* الأيقونة */}
      <div className="relative">
        {loading ? (
          <motion.div
            className={`${sizeClasses[size].icon} border-2 border-gray-300 border-t-blue-500 rounded-full`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        ) : (
          <Icon className={`${sizeClasses[size].icon} transition-colors duration-200`} />
        )}
        
        {/* تأثير الضغط */}
        {active && (
          <motion.div
            className={`absolute inset-0 ${sizeClasses[size].icon} rounded-full ${activeColor.replace('text-', 'bg-')} opacity-20`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: [0.3, 0] }}
            transition={{ duration: 0.6 }}
            key={Date.now()}
          />
        )}
      </div>

      {/* النص والعدد */}
      <div className={`flex items-center space-x-1 ${sizeClasses[size].text}`}>
        <span className="font-medium">{label}</span>
        {showCount && count > 0 && (
          <motion.span
            className={`
              font-semibold
              ${active ? activeColor : 'text-gray-500 dark:text-gray-400'}
            `}
            key={count}
            initial={{ scale: 1 }}
            animate={{ 
              scale: [1, 1.1, 1],
              transition: { duration: 0.2 }
            }}
          >
            ({formatCount(count)})
          </motion.span>
        )}
      </div>
    </motion.button>
  )
}

// نسخة مبسطة للأيقونة فقط
export const IconButton = ({
  icon: Icon,
  active = false,
  loading = false,
  disabled = false,
  onClick,
  activeColor = 'text-blue-500',
  size = 'medium',
  className = '',
  tooltip = ''
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12'
  }

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  }

  return (
    <motion.button
      className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        rounded-full
        transition-all duration-200
        hover:bg-gray-100 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${active ? activeColor : 'text-gray-600 dark:text-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      title={tooltip}
    >
      {loading ? (
        <motion.div
          className={`${iconSizes[size]} border-2 border-gray-300 border-t-blue-500 rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      ) : (
        <Icon className={iconSizes[size]} />
      )}
    </motion.button>
  )
}

// زر التفاعل مع عداد منفصل
export const InteractionButtonWithBadge = ({
  icon: Icon,
  label,
  count = 0,
  active = false,
  onClick,
  activeColor = 'text-blue-500',
  className = ''
}) => {
  return (
    <div className="relative">
      <motion.button
        className={`
          p-2 rounded-full
          transition-all duration-200
          hover:bg-gray-100 dark:hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${active ? activeColor : 'text-gray-600 dark:text-gray-400'}
          ${className}
        `}
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={label}
      >
        <Icon className="w-6 h-6" />
      </motion.button>
      
      {count > 0 && (
        <motion.div
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {count > 99 ? '99+' : count}
        </motion.div>
      )}
    </div>
  )
}

export default InteractionButton