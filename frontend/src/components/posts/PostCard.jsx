import React, { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

// Icons
import { 
  HeartIcon, 
  ChatBubbleOvalLeftIcon, 
  ShareIcon,
  BookmarkIcon,
  EllipsisHorizontalIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { 
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid 
} from '@heroicons/react/24/solid'

// Components
import UserAvatar from '../common/UserAvatar'
import MediaViewer from '../media/MediaViewer'
import InteractionButton from '../common/InteractionButton'
import ShareModal from '../modals/ShareModal'
import PostOptionsMenu from '../menus/PostOptionsMenu'
import CommentsSection from '../comments/CommentsSection'

const PostCard = ({ 
  post, 
  onLike, 
  onShare, 
  onComment, 
  onBookmark,
  onReport,
  onDelete,
  isDetailed = false,
  className = '' 
}) => {
  const { user } = useSelector(state => state.auth)
  const { isDarkMode } = useSelector(state => state.theme)
  
  const [showComments, setShowComments] = useState(isDetailed)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const videoRef = useRef(null)
  const audioRef = useRef(null)

  // معالجة تشغيل/إيقاف الفيديو
  const handleVideoToggle = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // معالجة كتم/إلغاء كتم الصوت
  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // معالجة الإعجاب
  const handleLike = async () => {
    try {
      await onLike()
    } catch (error) {
      console.error('خطأ في الإعجاب:', error)
    }
  }

  // معالجة المشاركة
  const handleShare = () => {
    setShowShareModal(true)
  }

  // معالجة التعليقات
  const handleComment = () => {
    setShowComments(!showComments)
  }

  // معالجة الحفظ
  const handleBookmark = async () => {
    try {
      await onBookmark()
    } catch (error) {
      console.error('خطأ في الحفظ:', error)
    }
  }

  // تنسيق الوقت
  const formatTime = (date) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ar 
    })
  }

  // تحديد نوع المحتوى
  const getMediaType = () => {
    if (post.media && post.media.length > 0) {
      const media = post.media[0]
      return media.type || 'image'
    }
    return null
  }

  const mediaType = getMediaType()

  return (
    <motion.article
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-soft overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      {/* رأس المنشور */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserAvatar 
              user={post.author} 
              size="medium"
              showOnline={true}
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                  {post.author.firstName} {post.author.lastName}
                </h3>
                {post.author.isVerified && (
                  <CheckBadgeIcon className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>@{post.author.username}</span>
                <span>•</span>
                <span>{formatTime(post.createdAt)}</span>
                {post.isEdited && (
                  <>
                    <span>•</span>
                    <span>معدل</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {post.visibility === 'private' && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                خاص
              </span>
            )}
            
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            >
              <EllipsisHorizontalIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            
            <AnimatePresence>
              {showOptionsMenu && (
                <PostOptionsMenu
                  post={post}
                  onClose={() => setShowOptionsMenu(false)}
                  onReport={onReport}
                  onDelete={onDelete}
                  isOwner={post.author.id === user?.id}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* محتوى المنشور */}
      <div className="p-4">
        {/* النص */}
        {post.content && (
          <div className="mb-4">
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
            
            {/* الهاشتاغات */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* الوسائط */}
        {post.media && post.media.length > 0 && (
          <div className="mb-4">
            <MediaViewer
              media={post.media}
              onLoad={() => setImageLoaded(true)}
              className="rounded-lg overflow-hidden"
            />
          </div>
        )}

        {/* معلومات الذكاء الاصطناعي */}
        {post.aiAnalysis && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                🤖 تحليل المحتوى
              </span>
              <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                نقاط الجودة: {post.aiAnalysis.qualityScore}/10
              </span>
            </div>
            
            {post.aiAnalysis.sentiment && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600 dark:text-gray-300">المشاعر:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  post.aiAnalysis.sentiment === 'positive' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : post.aiAnalysis.sentiment === 'negative'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {post.aiAnalysis.sentiment === 'positive' ? 'إيجابي' : 
                   post.aiAnalysis.sentiment === 'negative' ? 'سلبي' : 'محايد'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* تحذير المحتوى */}
        {post.contentWarning && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                تحذير: {post.contentWarning}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* إحصائيات التفاعل */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            {post.likesCount > 0 && (
              <span>{post.likesCount} إعجاب</span>
            )}
            {post.commentsCount > 0 && (
              <span>{post.commentsCount} تعليق</span>
            )}
            {post.sharesCount > 0 && (
              <span>{post.sharesCount} مشاركة</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {post.viewsCount > 0 && (
              <span>{post.viewsCount} مشاهدة</span>
            )}
          </div>
        </div>
      </div>

      {/* أزرار التفاعل */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <InteractionButton
              icon={post.isLiked ? HeartSolid : HeartIcon}
              label="إعجاب"
              count={post.likesCount}
              active={post.isLiked}
              onClick={handleLike}
              activeColor="text-red-500"
            />
            
            <InteractionButton
              icon={ChatBubbleOvalLeftIcon}
              label="تعليق"
              count={post.commentsCount}
              onClick={handleComment}
            />
            
            <InteractionButton
              icon={ShareIcon}
              label="مشاركة"
              count={post.sharesCount}
              onClick={handleShare}
            />
          </div>
          
          <InteractionButton
            icon={post.isBookmarked ? BookmarkSolid : BookmarkIcon}
            label="حفظ"
            active={post.isBookmarked}
            onClick={handleBookmark}
            activeColor="text-blue-500"
          />
        </div>
      </div>

      {/* قسم التعليقات */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-100 dark:border-gray-700"
          >
            <CommentsSection
              postId={post.id}
              comments={post.comments}
              onAddComment={onComment}
              showAll={isDetailed}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* نافذة المشاركة */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
        onShare={onShare}
      />
    </motion.article>
  )
}

export default PostCard