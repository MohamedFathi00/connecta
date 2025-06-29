import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { InfiniteScroll } from 'react-infinite-scroll-component'

// Components
import PostCard from '../components/posts/PostCard'
import CreatePost from '../components/posts/CreatePost'
import Stories from '../components/stories/Stories'
import TrendingSidebar from '../components/sidebar/TrendingSidebar'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'

// Icons
import { SparklesIcon, FireIcon } from '@heroicons/react/24/outline'

// Hooks
import { usePosts } from '../hooks/usePosts'
import { useSocket } from '../hooks/useSocket'

const HomePage = () => {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const [feedType, setFeedType] = useState('following') // following, explore, trending
  const [hasNewPosts, setHasNewPosts] = useState(false)

  const {
    posts,
    loading,
    hasMore,
    fetchPosts,
    refreshPosts,
    createPost,
    likePost,
    sharePost
  } = usePosts(feedType)

  const socket = useSocket()

  // تحديث الخلاصة في الوقت الفعلي
  useEffect(() => {
    if (socket) {
      socket.on('new-post', (post) => {
        if (feedType === 'following' && user?.following?.includes(post.userId)) {
          setHasNewPosts(true)
        }
      })

      socket.on('post-updated', (updatedPost) => {
        // تحديث المنشور في الخلاصة
        dispatch({
          type: 'posts/updatePost',
          payload: updatedPost
        })
      })

      return () => {
        socket.off('new-post')
        socket.off('post-updated')
      }
    }
  }, [socket, feedType, user, dispatch])

  const handleCreatePost = async (postData) => {
    try {
      await createPost(postData)
      // إشعار المتابعين
      if (socket) {
        socket.emit('new-post', {
          userId: user.id,
          post: postData
        })
      }
    } catch (error) {
      console.error('خطأ في إنشاء المنشور:', error)
    }
  }

  const handleRefresh = () => {
    refreshPosts()
    setHasNewPosts(false)
  }

  const feedTypeOptions = [
    { key: 'following', label: 'المتابَعون', icon: '👥' },
    { key: 'explore', label: 'استكشاف', icon: '🔍' },
    { key: 'trending', label: 'الرائج', icon: '🔥' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-6">
          
          {/* العمود الرئيسي */}
          <main className="lg:col-span-8">
            
            {/* القصص */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Stories />
            </motion.div>

            {/* مفاتيح تبديل نوع الخلاصة */}
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  {feedTypeOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setFeedType(option.key)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        feedType === option.key
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>

                {hasNewPosts && (
                  <motion.button
                    onClick={handleRefresh}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <SparklesIcon className="w-5 h-5" />
                    <span>منشورات جديدة</span>
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* إنشاء منشور */}
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <CreatePost onSubmit={handleCreatePost} />
            </motion.div>

            {/* خلاصة المنشورات */}
            <div className="space-y-6">
              {loading && posts.length === 0 ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts.length > 0 ? (
                <InfiniteScroll
                  dataLength={posts.length}
                  next={fetchPosts}
                  hasMore={hasMore}
                  loader={
                    <div className="text-center py-6">
                      <LoadingSpinner />
                    </div>
                  }
                  endMessage={
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <FireIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>وصلت إلى نهاية الخلاصة!</p>
                    </div>
                  }
                  refreshFunction={handleRefresh}
                  pullDownToRefresh
                  pullDownToRefreshThreshold={50}
                  pullDownToRefreshContent={
                    <div className="text-center py-4">
                      <span className="text-gray-500">اسحب للتحديث...</span>
                    </div>
                  }
                  releaseToRefreshContent={
                    <div className="text-center py-4">
                      <span className="text-gray-500">اتركه للتحديث...</span>
                    </div>
                  }
                >
                  {posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.1,
                        ease: "easeOut"
                      }}
                    >
                      <PostCard 
                        post={post}
                        onLike={() => likePost(post.id)}
                        onShare={() => sharePost(post.id)}
                        onComment={(comment) => console.log('تعليق:', comment)}
                      />
                    </motion.div>
                  ))}
                </InfiniteScroll>
              ) : (
                <EmptyState
                  icon="📱"
                  title="لا توجد منشورات بعد"
                  description={
                    feedType === 'following' 
                      ? "ابدأ بمتابعة أشخاص لرؤية منشوراتهم هنا"
                      : "لا توجد منشورات في هذا القسم حالياً"
                  }
                  actionText="استكشف المستخدمين"
                  onAction={() => setFeedType('explore')}
                />
              )}
            </div>
          </main>

          {/* الشريط الجانبي */}
          <aside className="lg:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <TrendingSidebar />
            </motion.div>

            {/* اقتراحات المتابعة */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                اقتراحات للمتابعة
              </h3>
              <div className="space-y-3">
                {/* مكونات اقتراحات المتابعة */}
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">سيتم إضافة اقتراحات المتابعة قريباً</p>
                </div>
              </div>
            </motion.div>

            {/* إعلانات أو محتوى إضافي */}
            <motion.div
              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <div className="text-center">
                <div className="text-3xl mb-3">🚀</div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  جرب الميزات الجديدة!
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  اكتشف فلاتر الواقع المعزز والبث المباشر
                </p>
                <button className="btn-primary text-sm">
                  اكتشف الآن
                </button>
              </div>
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default HomePage