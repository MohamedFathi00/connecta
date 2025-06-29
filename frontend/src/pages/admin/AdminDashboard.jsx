import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ShareIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'

// Components
import AdminSidebar from '../../components/admin/AdminSidebar'
import StatsCard from '../../components/admin/StatsCard'
import Chart from '../../components/admin/Chart'
import RecentActivity from '../../components/admin/RecentActivity'
import TopContent from '../../components/admin/TopContent'
import UserGrowthChart from '../../components/admin/UserGrowthChart'
import RevenueChart from '../../components/admin/RevenueChart'
import LoadingSpinner from '../../components/common/LoadingSpinner'

// Redux
import { fetchAdminStats } from '../../store/slices/adminSlice'

const AdminDashboard = () => {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const { 
    stats, 
    loading, 
    userGrowth, 
    contentStats, 
    recentActivity,
    topContent 
  } = useSelector(state => state.admin)

  const [timeRange, setTimeRange] = useState('7d') // 24h, 7d, 30d, 90d
  const [activeTab, setActiveTab] = useState('overview')

  // جلب البيانات عند التحميل
  useEffect(() => {
    if (user?.role === 'admin') {
      dispatch(fetchAdminStats({ timeRange }))
    }
  }, [dispatch, user, timeRange])

  // التحقق من صلاحيات الإدارة
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            الوصول مرفوض
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            تحتاج لصلاحيات إدارية للوصول لهذه الصفحة
          </p>
        </div>
      </div>
    )
  }

  const timeRangeOptions = [
    { value: '24h', label: '24 ساعة' },
    { value: '7d', label: '7 أيام' },
    { value: '30d', label: '30 يوم' },
    { value: '90d', label: '90 يوم' }
  ]

  const tabs = [
    { key: 'overview', label: 'نظرة عامة', icon: ChartBarIcon },
    { key: 'analytics', label: 'التحليلات', icon: TrendingUpIcon },
    { key: 'content', label: 'المحتوى', icon: DocumentTextIcon },
    { key: 'users', label: 'المستخدمون', icon: UsersIcon },
    { key: 'reports', label: 'البلاغات', icon: ExclamationTriangleIcon },
    { key: 'settings', label: 'الإعدادات', icon: CogIcon }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner fullScreen text="جاري تحميل لوحة الإدارة..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* رأس الصفحة */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  لوحة الإدارة
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  مرحباً بك {user.firstName}، إليك نظرة عامة على المنصة
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* منتقي الفترة الزمنية */}
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {timeRangeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                {/* إشعارات الإدارة */}
                <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <BellIcon className="w-6 h-6" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </div>
            </div>
            
            {/* علامات التبويب */}
            <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 overflow-x-auto">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`
                      flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                      ${activeTab === tab.key
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </header>

        {/* المحتوى الرئيسي */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* الإحصائيات الرئيسية */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="إجمالي المستخدمين"
                  value={stats?.totalUsers || 0}
                  change={stats?.userGrowth || 0}
                  icon={UsersIcon}
                  color="blue"
                />
                
                <StatsCard
                  title="المنشورات"
                  value={stats?.totalPosts || 0}
                  change={stats?.postGrowth || 0}
                  icon={DocumentTextIcon}
                  color="green"
                />
                
                <StatsCard
                  title="المستخدمون النشطون"
                  value={stats?.activeUsers || 0}
                  change={stats?.activeUsersGrowth || 0}
                  icon={TrendingUpIcon}
                  color="purple"
                />
                
                <StatsCard
                  title="البلاغات"
                  value={stats?.totalReports || 0}
                  change={stats?.reportsGrowth || 0}
                  icon={ExclamationTriangleIcon}
                  color="red"
                />
              </div>

              {/* الرسوم البيانية */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    نمو المستخدمين
                  </h3>
                  <UserGrowthChart data={userGrowth} timeRange={timeRange} />
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    إحصائيات المحتوى
                  </h3>
                  <Chart 
                    data={contentStats} 
                    type="bar"
                    labels={['المنشورات', 'التعليقات', 'الإعجابات', 'المشاركات']}
                  />
                </div>
              </div>

              {/* النشاطات الأخيرة والمحتوى الأفضل */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    النشاطات الأخيرة
                  </h3>
                  <RecentActivity activities={recentActivity} />
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    المحتوى الأفضل
                  </h3>
                  <TopContent content={topContent} />
                </div>
              </div>

              {/* إحصائيات التفاعل */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  إحصائيات التفاعل اليومية
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mx-auto mb-2">
                      <EyeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.dailyViews?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">مشاهدة</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg mx-auto mb-2">
                      <HeartIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.dailyLikes?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">إعجاب</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg mx-auto mb-2">
                      <ChatBubbleLeftRightIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.dailyComments?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">تعليق</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg mx-auto mb-2">
                      <ShareIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats?.dailyShares?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">مشاركة</div>
                  </div>
                </div>
                
                <Chart 
                  data={stats?.engagementChart || []}
                  type="line"
                  height={300}
                />
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* تحليلات متقدمة */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    أكثر الأوقات نشاطاً
                  </h3>
                  <div className="space-y-3">
                    {stats?.peakHours?.map((hour, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {hour.time}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${hour.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {hour.percentage}%
                          </span>
                        </div>
                      </div>
                    )) || []}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    التوزيع الجغرافي
                  </h3>
                  <div className="space-y-3">
                    {stats?.topCountries?.map((country, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{country.flag}</span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {country.name}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {country.users}
                        </span>
                      </div>
                    )) || []}
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    الأجهزة المستخدمة
                  </h3>
                  <div className="space-y-3">
                    {stats?.deviceStats?.map((device, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {device.type}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${device.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {device.percentage}%
                          </span>
                        </div>
                      </div>
                    )) || []}
                  </div>
                </div>
              </div>

              {/* معدلات التحويل */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  معدلات التحويل والتفاعل
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {stats?.conversionRates?.signUp || '0'}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      معدل التسجيل
                    </div>
                    <div className="flex items-center justify-center mt-2">
                      <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-500">+2.5%</span>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {stats?.conversionRates?.engagement || '0'}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      معدل التفاعل
                    </div>
                    <div className="flex items-center justify-center mt-2">
                      <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-500">+1.8%</span>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {stats?.conversionRates?.retention || '0'}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      معدل الاحتفاظ
                    </div>
                    <div className="flex items-center justify-center mt-2">
                      <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
                      <span className="text-sm text-red-500">-0.5%</span>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {stats?.conversionRates?.share || '0'}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      معدل المشاركة
                    </div>
                    <div className="flex items-center justify-center mt-2">
                      <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-500">+3.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* باقي التبويبات يمكن إضافتها هنا */}
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard