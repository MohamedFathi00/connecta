import React from 'react'
import { motion } from 'framer-motion'

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'blue', 
  className = '',
  text,
  fullScreen = false 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  }

  const colorClasses = {
    blue: 'border-blue-600',
    purple: 'border-purple-600',
    green: 'border-green-600',
    red: 'border-red-600',
    gray: 'border-gray-600',
    white: 'border-white'
  }

  const spinnerContent = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <motion.div
        className={`
          ${sizeClasses[size]} 
          border-4 
          ${colorClasses[color]} 
          border-t-transparent 
          rounded-full
        `}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      {text && (
        <motion.p 
          className={`mt-3 text-gray-600 dark:text-gray-400 ${
            size === 'small' ? 'text-sm' : 'text-base'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinnerContent}
      </div>
    )
  }

  return spinnerContent
}

export default LoadingSpinner