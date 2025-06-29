import React from 'react'
import { motion } from 'framer-motion'

const EmptyState = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  illustration,
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: {
      container: 'py-8',
      icon: 'text-4xl',
      title: 'text-lg',
      description: 'text-sm',
      illustration: 'w-32 h-32'
    },
    medium: {
      container: 'py-12',
      icon: 'text-6xl',
      title: 'text-xl',
      description: 'text-base',
      illustration: 'w-48 h-48'
    },
    large: {
      container: 'py-16',
      icon: 'text-8xl',
      title: 'text-2xl',
      description: 'text-lg',
      illustration: 'w-64 h-64'
    }
  }

  return (
    <motion.div
      className={`
        text-center ${sizeClasses[size].container}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* الرسم التوضيحي أو الأيقونة */}
      <div className="mb-6">
        {illustration ? (
          <motion.div
            className={`mx-auto ${sizeClasses[size].illustration} flex items-center justify-center`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {typeof illustration === 'string' ? (
              <img 
                src={illustration} 
                alt={title}
                className="w-full h-full object-contain opacity-60"
              />
            ) : (
              illustration
            )}
          </motion.div>
        ) : icon && (
          <motion.div
            className={`${sizeClasses[size].icon} mb-4`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
          >
            {icon}
          </motion.div>
        )}
      </div>

      {/* العنوان */}
      {title && (
        <motion.h3
          className={`
            font-semibold text-gray-900 dark:text-white mb-3
            ${sizeClasses[size].title}
          `}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {title}
        </motion.h3>
      )}

      {/* الوصف */}
      {description && (
        <motion.p
          className={`
            text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto leading-relaxed
            ${sizeClasses[size].description}
          `}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {description}
        </motion.p>
      )}

      {/* زر الإجراء */}
      {actionText && onAction && (
        <motion.button
          onClick={onAction}
          className="btn-primary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {actionText}
        </motion.button>
      )}
    </motion.div>
  )
}

// متغيرات جاهزة للاستخدام
export const NoPostsFound = ({ onCreatePost }) => (
  <EmptyState
    icon="📝"
    title="لا توجد منشورات بعد"
    description="ابدأ بكتابة أول منشور لك ومشاركته مع الأصدقاء"
    actionText="إنشاء منشور"
    onAction={onCreatePost}
  />
)

export const NoUsersFound = ({ onInviteFriends }) => (
  <EmptyState
    icon="👥"
    title="لا توجد مستخدمون"
    description="ادع أصدقاءك للانضمام إلى المنصة"
    actionText="دعوة الأصدقاء"
    onAction={onInviteFriends}
  />
)

export const NoNotificationsFound = () => (
  <EmptyState
    icon="🔔"
    title="لا توجد إشعارات"
    description="ستظهر الإشعارات الجديدة هنا عند وصولها"
    size="small"
  />
)

export const NoMessagesFound = ({ onStartChat }) => (
  <EmptyState
    icon="💬"
    title="لا توجد رسائل"
    description="ابدأ محادثة جديدة مع أصدقائك"
    actionText="بدء محادثة"
    onAction={onStartChat}
  />
)

export const SearchNoResults = ({ query, onClearSearch }) => (
  <EmptyState
    icon="🔍"
    title="لا توجد نتائج"
    description={`لم يتم العثور على نتائج لـ "${query}"`}
    actionText="مسح البحث"
    onAction={onClearSearch}
    size="small"
  />
)

export const NetworkError = ({ onRetry }) => (
  <EmptyState
    icon="📡"
    title="خطأ في الاتصال"
    description="تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت"
    actionText="إعادة المحاولة"
    onAction={onRetry}
  />
)

export const AccessDenied = ({ onGoBack }) => (
  <EmptyState
    icon="🚫"
    title="غير مسموح"
    description="ليس لديك صلاحية لعرض هذا المحتوى"
    actionText="العودة"
    onAction={onGoBack}
  />
)

export const UnderMaintenance = () => (
  <EmptyState
    icon="🔧"
    title="تحت الصيانة"
    description="الموقع تحت الصيانة حالياً. سنعود قريباً!"
    size="large"
  />
)

export const ComingSoon = () => (
  <EmptyState
    icon="🚀"
    title="قريباً..."
    description="هذه الميزة تحت التطوير وستكون متاحة قريباً"
  />
)

export const LoadingState = ({ message = "جاري التحميل..." }) => (
  <motion.div
    className="text-center py-12"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <motion.div
      className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
    <p className="text-gray-600 dark:text-gray-400">{message}</p>
  </motion.div>
)

export default EmptyState