import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'

const Select = ({
  value,
  options = [],
  onChange,
  placeholder = 'اختر خيار...',
  disabled = false,
  error = null,
  className = '',
  size = 'medium',
  searchable = false,
  multiple = false,
  clearable = false,
  loading = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOptions, setSelectedOptions] = useState(
    multiple ? (Array.isArray(value) ? value : []) : []
  )
  
  const selectRef = useRef(null)
  const searchInputRef = useRef(null)

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // التركيز على حقل البحث عند فتح القائمة
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  // أحجام المكون
  const sizes = {
    small: {
      container: 'h-8 text-sm',
      option: 'px-3 py-1.5 text-sm',
      input: 'px-3 py-1.5 text-sm'
    },
    medium: {
      container: 'h-10 text-base',
      option: 'px-3 py-2 text-base',
      input: 'px-3 py-2 text-base'
    },
    large: {
      container: 'h-12 text-lg',
      option: 'px-4 py-3 text-lg',
      input: 'px-4 py-3 text-lg'
    }
  }

  const currentSize = sizes[size]

  // فلترة الخيارات حسب البحث
  const filteredOptions = searchable && searchQuery
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options

  // الحصول على الخيار المحدد
  const getSelectedOption = () => {
    if (multiple) {
      return selectedOptions.length > 0 
        ? `${selectedOptions.length} عنصر محدد`
        : placeholder
    }
    
    const option = options.find(opt => opt.value === value)
    return option ? option.label : placeholder
  }

  // معالجة اختيار خيار
  const handleOptionSelect = (option) => {
    if (multiple) {
      const newSelected = selectedOptions.includes(option.value)
        ? selectedOptions.filter(val => val !== option.value)
        : [...selectedOptions, option.value]
      
      setSelectedOptions(newSelected)
      onChange && onChange(newSelected)
    } else {
      onChange && onChange(option.value)
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  // مسح الاختيار
  const handleClear = (e) => {
    e.stopPropagation()
    if (multiple) {
      setSelectedOptions([])
      onChange && onChange([])
    } else {
      onChange && onChange(null)
    }
  }

  // التحقق من كون الخيار محدد
  const isOptionSelected = (option) => {
    if (multiple) {
      return selectedOptions.includes(option.value)
    }
    return value === option.value
  }

  return (
    <div ref={selectRef} className={`relative ${className}`} {...props}>
      {/* زر الاختيار الرئيسي */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          ${currentSize.container}
          w-full flex items-center justify-between
          px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600
          rounded-lg shadow-sm transition-colors duration-200
          ${disabled 
            ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 cursor-not-allowed' 
            : 'hover:border-gray-400 dark:hover:border-gray-500 cursor-pointer'
          }
          ${error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
            : 'focus:border-blue-500 focus:ring-blue-500'
          }
          focus:outline-none focus:ring-2 focus:ring-offset-2
          text-gray-900 dark:text-white
        `}
      >
        <span className={`block truncate ${!value && !selectedOptions.length ? 'text-gray-500 dark:text-gray-400' : ''}`}>
          {getSelectedOption()}
        </span>
        
        <div className="flex items-center space-x-2">
          {/* زر المسح */}
          {clearable && (value || selectedOptions.length > 0) && !disabled && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          {/* مؤشر التحميل */}
          {loading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          ) : (
            <ChevronDownIcon 
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`} 
            />
          )}
        </div>
      </button>

      {/* رسالة الخطأ */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* قائمة الخيارات */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
          >
            {/* حقل البحث */}
            {searchable && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="البحث..."
                  className={`
                    ${currentSize.input}
                    w-full border border-gray-300 dark:border-gray-600 rounded-md
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  `}
                />
              </div>
            )}

            {/* قائمة الخيارات */}
            <div className="py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(option)}
                    className={`
                      ${currentSize.option}
                      w-full text-right flex items-center justify-between
                      transition-colors duration-150
                      ${isOptionSelected(option)
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    <div className="flex-1 text-right">
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      )}
                    </div>
                    
                    {isOptionSelected(option) && (
                      <CheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mr-2" />
                    )}
                  </button>
                ))
              ) : (
                <div className={`${currentSize.option} text-gray-500 dark:text-gray-400 text-center`}>
                  {searchQuery ? 'لا توجد نتائج' : 'لا توجد خيارات'}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Select