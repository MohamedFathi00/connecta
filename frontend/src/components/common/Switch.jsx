import React from 'react'
import { motion } from 'framer-motion'

const Switch = ({ 
  checked = false, 
  onChange, 
  disabled = false,
  size = 'medium',
  color = 'blue',
  className = '',
  ...props 
}) => {
  const sizes = {
    small: {
      switch: 'w-8 h-5',
      thumb: 'w-3 h-3',
      translate: 'translate-x-3'
    },
    medium: {
      switch: 'w-11 h-6',
      thumb: 'w-4 h-4',
      translate: 'translate-x-5'
    },
    large: {
      switch: 'w-14 h-8',
      thumb: 'w-6 h-6',
      translate: 'translate-x-6'
    }
  }

  const colors = {
    blue: {
      on: 'bg-blue-600',
      off: 'bg-gray-200 dark:bg-gray-700'
    },
    green: {
      on: 'bg-green-600',
      off: 'bg-gray-200 dark:bg-gray-700'
    },
    red: {
      on: 'bg-red-600',
      off: 'bg-gray-200 dark:bg-gray-700'
    },
    purple: {
      on: 'bg-purple-600',
      off: 'bg-gray-200 dark:bg-gray-700'
    }
  }

  const currentSize = sizes[size]
  const currentColor = colors[color]

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange && onChange(!checked)}
      disabled={disabled}
      className={`
        ${currentSize.switch}
        relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out
        ${checked ? currentColor.on : currentColor.off}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        ${className}
      `}
      {...props}
    >
      <motion.span
        className={`
          ${currentSize.thumb}
          inline-block bg-white rounded-full shadow-lg transform transition-transform duration-200 ease-in-out
        `}
        animate={{
          x: checked ? 
            (size === 'small' ? 12 : size === 'medium' ? 20 : 24) : 
            2
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      />
    </button>
  )
}

export default Switch