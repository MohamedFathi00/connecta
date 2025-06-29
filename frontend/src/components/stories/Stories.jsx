import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'

// Icons
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

// Components
import { StoryAvatar } from '../common/UserAvatar'
import StoryViewer from './StoryViewer'
import CreateStoryModal from './CreateStoryModal'

const Stories = ({ className = '' }) => {
  const { user } = useSelector(state => state.auth)
  const [stories, setStories] = useState([
    // بيانات وهمية للعرض
    {
      id: 1,
      user: {
        id: 1,
        firstName: 'أحمد',
        lastName: 'محمد',
        username: 'ahmed_m',
        avatar: null,
        isVerified: true
      },
      items: [
        {
          id: 1,
          type: 'image',
          url: 'https://via.placeholder.com/400x600/4F46E5/ffffff?text=Story+1',
          duration: 5000,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ],
      hasViewed: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      user: {
        id: 2,
        firstName: 'فاطمة',
        lastName: 'علي',
        username: 'fatima_a',
        avatar: null,
        isVerified: false
      },
      items: [
        {
          id: 2,
          type: 'image',
          url: 'https://via.placeholder.com/400x600/EC4899/ffffff?text=Story+2',
          duration: 5000,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ],
      hasViewed: true,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      user: {
        id: 3,
        firstName: 'سارة',
        lastName: 'حسن',
        username: 'sara_h',
        avatar: null,
        isVerified: true
      },
      items: [
        {
          id: 3,
          type: 'video',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          thumbnail: 'https://via.placeholder.com/400x600/10B981/ffffff?text=Video+Story',
          duration: 15000,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ],
      hasViewed: false,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }
  ])
  
  const [selectedStory, setSelectedStory] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  
  const scrollRef = useRef(null)

  // التحقق من إمكانية التمرير
  useEffect(() => {
    const checkScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
      }
    }

    checkScroll()
    
    const scrollElement = scrollRef.current
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScroll)
      return () => scrollElement.removeEventListener('scroll', checkScroll)
    }
  }, [stories])

  // التمرير يميناً ويساراً
  const scrollStories = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 200
      const newScrollLeft = direction === 'left' 
        ? scrollRef.current.scrollLeft - scrollAmount
        : scrollRef.current.scrollLeft + scrollAmount
        
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    }
  }

  // فتح عارض القصة
  const openStoryViewer = (story, startIndex = 0) => {
    setSelectedStory({ ...story, startIndex })
    
    // تحديد القصة كمشاهدة
    setStories(prev => prev.map(s => 
      s.id === story.id ? { ...s, hasViewed: true } : s
    ))
  }

  // إغلاق عارض القصة
  const closeStoryViewer = () => {
    setSelectedStory(null)
  }

  // الانتقال للقصة التالية
  const nextStory = () => {
    if (!selectedStory) return
    
    const currentIndex = stories.findIndex(s => s.id === selectedStory.id)
    const nextIndex = currentIndex + 1
    
    if (nextIndex < stories.length) {
      openStoryViewer(stories[nextIndex])
    } else {
      closeStoryViewer()
    }
  }

  // الانتقال للقصة السابقة
  const previousStory = () => {
    if (!selectedStory) return
    
    const currentIndex = stories.findIndex(s => s.id === selectedStory.id)
    const prevIndex = currentIndex - 1
    
    if (prevIndex >= 0) {
      openStoryViewer(stories[prevIndex])
    }
  }

  // إنشاء قصة جديدة
  const handleCreateStory = (storyData) => {
    const newStory = {
      id: Date.now(),
      user: user,
      items: [
        {
          id: Date.now(),
          type: storyData.type,
          url: storyData.url,
          duration: storyData.type === 'video' ? 15000 : 5000,
          createdAt: new Date().toISOString()
        }
      ],
      hasViewed: false,
      createdAt: new Date().toISOString()
    }
    
    setStories(prev => [newStory, ...prev])
    setShowCreateModal(false)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-4">
        {/* زر التمرير الأيسر */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border dark:border-gray-700"
              onClick={() => scrollStories('left')}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* منطقة القصص */}
        <div
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide py-4 px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* إضافة قصة جديدة */}
          <motion.div
            className="flex-shrink-0 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
          >
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                <PlusIcon className="w-8 h-8 text-white" />
              </div>
              <div className="text-center mt-2">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  قصتك
                </span>
              </div>
            </div>
          </motion.div>

          {/* قائمة القصص */}
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              className="flex-shrink-0 cursor-pointer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="text-center">
                <StoryAvatar
                  user={story.user}
                  hasStory={true}
                  hasViewedStory={story.hasViewed}
                  onClick={() => openStoryViewer(story)}
                  size="large"
                />
                <div className="mt-2 max-w-[64px]">
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate block">
                    {story.user.firstName}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* زر التمرير الأيمن */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border dark:border-gray-700"
              onClick={() => scrollStories('right')}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* عارض القصص */}
      <AnimatePresence>
        {selectedStory && (
          <StoryViewer
            story={selectedStory}
            onClose={closeStoryViewer}
            onNext={nextStory}
            onPrevious={previousStory}
            hasNext={stories.findIndex(s => s.id === selectedStory.id) < stories.length - 1}
            hasPrevious={stories.findIndex(s => s.id === selectedStory.id) > 0}
          />
        )}
      </AnimatePresence>

      {/* نافذة إنشاء قصة */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateStoryModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateStory}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Stories