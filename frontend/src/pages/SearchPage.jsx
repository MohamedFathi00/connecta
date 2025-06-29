import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { debounce } from 'lodash'

// Icons
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ClockIcon,
  TrendingUpIcon,
  HashtagIcon,
  UserIcon,
  PhotoIcon,
  VideoCameraIcon,
  SpeakerWaveIcon,
  CalendarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'

// Components
import PostCard from '../components/posts/PostCard'
import UserCard from '../components/users/UserCard'
import HashtagCard from '../components/hashtags/HashtagCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import Select from '../components/common/Select'
import Switch from '../components/common/Switch'

// Redux
import { searchContent, clearSearchResults } from '../store/slices/searchSlice'
import { addToSearchHistory, clearSearchHistory } from '../store/slices/uiSlice'

const SearchPage = () => {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const { 
    results, 
    loading, 
    hasMore, 
    totalResults 
  } = useSelector(state => state.search)
  
  const { searchHistory } = useSelector(state => state.ui)
  
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeTab, setActiveTab] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    type: 'all', // all, posts, users, hashtags, media
    sortBy: 'relevance', // relevance, date, popularity
    dateRange: 'all', // all, today, week, month, year
    mediaType: 'all', // all, image, video, audio
    location: '',
    verified: false,
    hasMedia: false
  })

  // تحديث URL عند تغيير البحث
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query })
    } else {
      setSearchParams({})
    }
  }, [query, setSearchParams])

  // البحث المتأخر لتحسين الأداء
  const debouncedSearch = useCallback(
    debounce((searchQuery, searchFilters) => {
      if (searchQuery.trim()) {
        dispatch(searchContent({
          query: searchQuery,
          filters: searchFilters,
          page: 1
        }))
        dispatch(addToSearchHistory(searchQuery))
      } else {
        dispatch(clearSearchResults())
      }
    }, 500),
    [dispatch]
  )

  // تنفيذ البحث عند تغيير المدخلات
  useEffect(() => {
    debouncedSearch(query, filters)
  }, [query, filters, debouncedSearch])

  // علامات التبويب
  const tabs = [
    {
      key: 'all',
      label: 'الكل',
      icon: MagnifyingGlassIcon,
      count: totalResults?.all || 0
    },
    {
      key: 'posts',
      label: 'المنشورات',
      icon: HashtagIcon,
      count: totalResults?.posts || 0
    },
    {
      key: 'users',
      label: 'الأشخاص',
      icon: UserIcon,
      count: totalResults?.users || 0
    },
    {
      key: 'media',
      label: 'الوسائط',
      icon: PhotoIcon,
      count: totalResults?.media || 0
    },
    {
      key: 'hashtags',
      label: 'الهاشتاغات',
      icon: HashtagIcon,
      count: totalResults?.hashtags || 0
    }
  ]

  // خيارات التصفية
  const sortOptions = [
    { value: 'relevance', label: 'الأكثر صلة' },
    { value: 'date', label: 'الأحدث' },
    { value: 'popularity', label: 'الأكثر شعبية' }
  ]

  const dateRangeOptions = [
    { value: 'all', label: 'أي وقت' },
    { value: 'today', label: 'اليوم' },
    { value: 'week', label: 'هذا الأسبوع' },
    { value: 'month', label: 'هذا الشهر' },
    { value: 'year', label: 'هذا العام' }
  ]

  const mediaTypeOptions = [
    { value: 'all', label: 'جميع الوسائط' },
    { value: 'image', label: 'صور' },
    { value: 'video', label: 'فيديو' },
    { value: 'audio', label: 'صوت' }
  ]

  // معالجة تغيير الفلتر
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // مسح البحث
  const clearSearch = () => {
    setQuery('')
    dispatch(clearSearchResults())
  }

  // اقتراحات البحث الذكية
  const searchSuggestions = [
    'تصميم جرافيك',
    'برمجة',
    'سفر',
    'طبخ',
    'تصوير',
    'رياضة',
    'تكنولوجيا',
    'صحة'
  ]

  // الترندات
  const trendingTopics = [
    { tag: 'الذكي_الاصطناعي', count: '12.5k' },
    { tag: 'تطوير_الويب', count: '8.3k' },
    { tag: 'التصميم', count: '6.1k' },
    { tag: 'ريادة_الأعمال', count: '4.9k' },
    { tag: 'التسويق_الرقمي', count: '3.7k' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        
        {/* شريط البحث الرئيسي */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن منشورات، أشخاص، هاشتاغات..."
                className="w-full pr-12 pl-4 py-4 text-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>

            {/* اقتراحات البحث السريع */}
            {!query && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                  اقتراحات:
                </span>
                {searchSuggestions.slice(0, 4).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {!query ? (
          /* صفحة البحث الافتراضية */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* تاريخ البحث */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <ClockIcon className="w-6 h-6 ml-2 text-gray-500" />
                    عمليات البحث الأخيرة
                  </h2>
                  {searchHistory.length > 0 && (
                    <button
                      onClick={() => dispatch(clearSearchHistory())}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      مسح الكل
                    </button>
                  )}
                </div>
                
                {searchHistory.length > 0 ? (
                  <div className="space-y-2">
                    {searchHistory.slice(0, 10).map((item, index) => (
                      <button
                        key={index}
                        onClick={() => setQuery(item)}
                        className="w-full text-right p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
                      >
                        <ClockIcon className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon="🔍"
                    title="لا يوجد تاريخ بحث"
                    description="عمليات البحث السابقة ستظهر هنا"
                    size="small"
                  />
                )}
              </div>
            </div>

            {/* الترندات */}
            <div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingUpIcon className="w-6 h-6 ml-2 text-red-500" />
                  الأكثر تداولاً
                </h2>
                
                <div className="space-y-3">
                  {trendingTopics.map((topic, index) => (
                    <button
                      key={topic.tag}
                      onClick={() => setQuery(`#${topic.tag}`)}
                      className="w-full text-right p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            #{index + 1} · الترند
                          </div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            #{topic.tag}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {topic.count} منشور
                          </div>
                        </div>
                        <HashtagIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* نتائج البحث */
          <div>
            {/* شريط الأدوات */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600 dark:text-gray-400">
                  {totalResults?.all || 0} نتيجة للبحث عن "{query}"
                </span>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FunnelIcon className="w-5 h-5" />
                <span>فلترة</span>
              </button>
            </div>

            {/* فلاتر البحث */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6 mb-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    خيارات الفلترة
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ترتيب حسب
                      </label>
                      <Select
                        value={filters.sortBy}
                        options={sortOptions}
                        onChange={(value) => handleFilterChange('sortBy', value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        الفترة الزمنية
                      </label>
                      <Select
                        value={filters.dateRange}
                        options={dateRangeOptions}
                        onChange={(value) => handleFilterChange('dateRange', value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        نوع الوسائط
                      </label>
                      <Select
                        value={filters.mediaType}
                        options={mediaTypeOptions}
                        onChange={(value) => handleFilterChange('mediaType', value)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        الموقع
                      </label>
                      <input
                        type="text"
                        value={filters.location}
                        onChange={(e) => handleFilterChange('location', e.target.value)}
                        placeholder="أي موقع"
                        className="input-field"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={filters.verified}
                        onChange={(value) => handleFilterChange('verified', value)}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        حسابات موثقة فقط
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={filters.hasMedia}
                        onChange={(value) => handleFilterChange('hasMedia', value)}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        يحتوي على وسائط
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* علامات التبويب */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex space-x-8 overflow-x-auto">
                {tabs.map((tab) => (
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
                    {tab.count > 0 && (
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* نتائج البحث */}
            <div>
              {loading ? (
                <LoadingSpinner text="جاري البحث..." />
              ) : results[activeTab]?.length > 0 ? (
                <div className="space-y-6">
                  {activeTab === 'posts' && (
                    results.posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))
                  )}
                  
                  {activeTab === 'users' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.users.map((user) => (
                        <UserCard key={user.id} user={user} />
                      ))}
                    </div>
                  )}
                  
                  {activeTab === 'hashtags' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.hashtags.map((hashtag) => (
                        <HashtagCard key={hashtag.id} hashtag={hashtag} />
                      ))}
                    </div>
                  )}
                  
                  {activeTab === 'all' && (
                    <div className="space-y-8">
                      {/* المنشورات */}
                      {results.posts?.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            المنشورات
                          </h3>
                          <div className="space-y-6">
                            {results.posts.slice(0, 3).map((post) => (
                              <PostCard key={post.id} post={post} />
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* الأشخاص */}
                      {results.users?.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            الأشخاص
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {results.users.slice(0, 6).map((user) => (
                              <UserCard key={user.id} user={user} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon="🔍"
                  title="لا توجد نتائج"
                  description={`لم يتم العثور على نتائج للبحث عن "${query}"`}
                  actionText="مسح البحث"
                  onAction={clearSearch}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchPage