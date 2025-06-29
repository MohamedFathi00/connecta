import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'

const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  ...props
}) => {
  // إعدادات الأحجام
  const sizes = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  // منع التمرير عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // إغلاق النافذة بالضغط على Escape
  useEffect(() => {
    if (!closeOnEscape) return

    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  // إغلاق النافذة عند النقر على الخلفية
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* الخلفية المظلمة */}
          <motion.div
            className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity ${overlayClassName}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOverlayClick}
          />

          {/* حاوية النافذة */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              className={`
                relative w-full ${sizes[size]} mx-auto
                bg-white dark:bg-gray-800 rounded-xl shadow-2xl
                ${className}
              `}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              {...props}
            >
              {/* رأس النافذة */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  {title && (
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {title}
                    </h2>
                  )}
                  
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="إغلاق"
                    >
                      <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  )}
                </div>
              )}

              {/* محتوى النافذة */}
              <div className={`p-6 ${contentClassName}`}>
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

// نافذة تأكيد
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأكيد',
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  type = 'default', // default, danger, warning, success
  loading = false
}) => {
  const typeClasses = {
    default: 'btn-primary',
    danger: 'btn-danger',
    warning: 'btn-warning',
    success: 'btn-success'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
    >
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {message}
        </p>
        
        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-secondary"
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`${typeClasses[type]} flex items-center space-x-2`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  )
}

// نافذة تحميل
export const LoadingModal = ({
  isOpen,
  message = 'جاري التحميل...',
  showProgress = false,
  progress = 0
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      size="small"
    >
      <div className="text-center py-6">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {message}
        </p>
        
        {showProgress && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        {showProgress && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {progress}% مكتمل
          </p>
        )}
      </div>
    </Modal>
  )
}

// نافذة نجح العملية
export const SuccessModal = ({
  isOpen,
  onClose,
  title = 'تم بنجاح!',
  message,
  buttonText = 'موافق'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
    >
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        {message && (
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {message}
          </p>
        )}
        
        <button
          onClick={onClose}
          className="btn-success"
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  )
}

// نافذة خطأ
export const ErrorModal = ({
  isOpen,
  onClose,
  title = 'حدث خطأ',
  message,
  buttonText = 'موافق'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
    >
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        {message && (
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {message}
          </p>
        )}
        
        <button
          onClick={onClose}
          className="btn-danger"
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  )
}

export default Modal