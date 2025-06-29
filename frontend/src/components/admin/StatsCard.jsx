import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

const StatsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue',
  prefix = '',
  suffix = '',
  trend = null,
  description = null,
  loading = false
}) => {
  // ألوان المكون
  const colors = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      text: 'text-green-600 dark:text-green-400'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      text: 'text-red-600 dark:text-red-400'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      text: 'text-purple-600 dark:text-purple-400'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: 'text-yellow-600 dark:text-yellow-400',
      text: 'text-yellow-600 dark:text-yellow-400'
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      icon: 'text-indigo-600 dark:text-indigo-400',
      text: 'text-indigo-600 dark:text-indigo-400'
    }
  }

  const currentColor = colors[color] || colors.blue

  // تنسيق الأرقام
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num?.toLocaleString() || '0'
  }

  // تحديد اتجاه التغيير
  const getChangeDirection = () => {
    if (change > 0) return 'up'
    if (change < 0) return 'down'
    return 'neutral'
  }

  const changeDirection = getChangeDirection()

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 border border-gray-100 dark:border-gray-700"
      whileHover={{ 
        scale: 1.02,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${currentColor.bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${currentColor.icon}`} />
        </div>
        
        {trend && (
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            trend === 'up' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : trend === 'down'
              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {prefix}{formatNumber(value)}{suffix}
        </div>
        
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </h3>
          
          {change !== null && change !== undefined && (
            <div className={`flex items-center space-x-1 text-sm font-medium ${
              changeDirection === 'up' 
                ? 'text-green-600 dark:text-green-400'
                : changeDirection === 'down'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {changeDirection === 'up' && <ArrowUpIcon className="w-4 h-4" />}
              {changeDirection === 'down' && <ArrowDownIcon className="w-4 h-4" />}
              <span>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// مكون إحصائيات مبسط
export const SimpleStatsCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const colors = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    purple: 'text-purple-600 dark:text-purple-400'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center space-x-3">
        <Icon className={`w-8 h-8 ${colors[color]}`} />
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value?.toLocaleString() || '0'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {title}
          </div>
        </div>
      </div>
    </div>
  )
}

// مكون إحصائيات متقدم
export const AdvancedStatsCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue',
  chartData = [],
  showChart = false 
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-${color}-50 dark:bg-${color}-900/20 rounded-lg flex items-center justify-center`}>
            <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </h3>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {value?.toLocaleString() || '0'}
            </div>
          </div>
        </div>
        
        {change && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
            change > 0 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}>
            {change > 0 ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      
      {showChart && chartData.length > 0 && (
        <div className="mt-4">
          {/* مخطط بسيط - يمكن استبداله بمكتبة رسوم بيانية */}
          <div className="flex items-end space-x-1 h-16">
            {chartData.slice(-7).map((value, index) => (
              <div
                key={index}
                className={`bg-${color}-200 dark:bg-${color}-800 rounded-t-sm flex-1`}
                style={{
                  height: `${(value / Math.max(...chartData)) * 100}%`
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StatsCard