import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

// Icons
import {
  CameraIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  UserMinusIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  MapPinIcon,
  CalendarIcon,
  LinkIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

// Components
import UserAvatar from '../components/common/UserAvatar'
import PostCard from '../components/posts/PostCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import EditProfileModal from '../components/modals/EditProfileModal'
import FollowersModal from '../components/modals/FollowersModal'
import PhotoGallery from '../components/media/PhotoGallery'

// Redux Actions
import { 
  fetchUserProfile, 
  followUser, 
  unfollowUser,
  blockUser,
  reportUser
} from '../store/slices/usersSlice'
import { fetchPosts } from '../store/slices/postsSlice'

const ProfilePage = () => {
  const { username } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  const { user: currentUser } = useSelector(state => state.auth)
  const { currentUserProfile, profileLoading } = useSelector(state => state.users)
  const { posts, loading: postsLoading } = useSelector(state => state.posts)
  
  const [activeTab, setActiveTab] = useState('posts') // posts, media, likes
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [followersType, setFollowersType] = useState('followers') // followers, following
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const isOwnProfile = currentUser?.username === username
  const profile = currentUserProfile

  // جلب بيانات الملف الشخصي
  useEffect(() => {
    if (username) {
      dispatch(fetchUserProfile(username))
    }
  }, [username, dispatch])

  // جلب منشورات المستخدم
  useEffect(() => {
    if (profile?.id) {
      dispatch(fetchPosts({ 
        userId: profile.id,
        type: activeTab === 'posts' ? 'user' : activeTab
      }))
    }
  }, [profile?.id, activeTab, dispatch])

  // تحديد حالة المتابعة
  useEffect(() => {
    if (profile && currentUser) {
      setIsFollowing(profile.isFollowing || false)
    }
  }, [profile, currentUser])

  // معالجة المتابعة/إلغاء المتابعة
  const handleFollowToggle = async () => {
    if (!profile || followLoading) return
    
    setFollowLoading(true)
    
    try {
      if (isFollowing) {
        await dispatch(unfollowUser(profile.id))
        setIsFollowing(false)
        toast.success('تم إلغاء المتابعة')
      } else {
        await dispatch(followUser(profile.id))
        setIsFollowing(true)
        toast.success('تم بدء المتابعة')
      }
    } catch (error) {
      toast.error('حدث خطأ في العملية')
    } finally {
      setFollowLoading(false)
    }
  }

  // معالجة الحظر
  const handleBlock = async () => {
    if (!profile) return
    
    try {
      await dispatch(blockUser(profile.id))
      toast.success('تم حظر المستخدم')
      navigate('/')
    } catch (error) {
      toast.error('فشل في حظر المستخدم')
    }
  }

  // معالجة الإبلاغ
  const handleReport = async (reason, description) => {
    if (!profile) return
    
    try {
      await dispatch(reportUser({
        userId: profile.id,
        reason,
        description
      }))
      toast.success('تم إرسال البلاغ')
    } catch (error) {
      toast.error('فشل في إرسال البلاغ')
    }
  }

  // معالجة بدء المحادثة
  const handleStartChat = () => {
    if (profile) {
      navigate(`/messages?user=${profile.username}`)
    }
  }

  // معالجة المشاركة
  const handleShare = async () => {
    if (navigator.share && profile) {
      try {
        await navigator.share({
          title: `${profile.firstName} ${profile.lastName}`,
          text: `تحقق من ملف ${profile.firstName} الشخصي`,
          url: window.location.href
        })
      } catch (error) {
        // نسخ الرابط إلى الحافظة
        navigator.clipboard.writeText(window.location.href)
        toast.success('تم نسخ الرابط')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('تم نسخ الرابط')
    }
  }

  // علامات التبويب
  const tabs = [
    { key: 'posts', label: 'المنشورات', count: profile?.postsCount || 0 },
    { key: 'media', label: 'الوسائط', count: profile?.mediaCount || 0 },
    { key: 'likes', label: 'الإعجابات', count: profile?.likesCount || 0 }
  ]

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner fullScreen text="جاري تحميل الملف الشخصي..." />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <EmptyState
          icon="👤"
          title="المستخدم غير موجود"
          description="لم يتم العثور على هذا المستخدم"
          actionText="العودة للرئيسية"
          onAction={() => navigate('/')}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        
        {/* صورة الغلاف */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
          {profile.coverPhoto ? (
            <img
              src={profile.coverPhoto}
              alt="صورة الغلاف"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500" />
          )}
          
          {/* زر تحرير الغلاف */}
          {isOwnProfile && (
            <motion.button
              className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <CameraIcon className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* معلومات الملف الشخصي */}
        <div className="relative bg-white dark:bg-gray-800 -mt-16 mx-4 rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-6">
            
            {/* الصورة الشخصية */}
            <div className="relative -mt-16 mb-4 md:mb-0">
              <UserAvatar 
                user={profile} 
                size="xxxl"
                className="ring-4 ring-white dark:ring-gray-800"
              />
              
              {isOwnProfile && (
                <motion.button
                  className="absolute bottom-2 right-2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CameraIcon className="w-4 h-4" />
                </motion.button>
              )}
            </div>

            {/* معلومات المستخدم */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile.firstName} {profile.lastName}
                </h1>
                {profile.isVerified && (
                  <CheckBadgeIcon className="w-6 h-6 text-blue-500" />
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                @{profile.username}
              </p>
              
              {profile.bio && (
                <p className="text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
                  {profile.bio}
                </p>
              )}
              
              {/* معلومات إضافية */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                {profile.location && (
                  <div className="flex items-center space-x-1">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                
                {profile.website && (
                  <div className="flex items-center space-x-1">
                    <LinkIcon className="w-4 h-4" />
                    <a 
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
                
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>انضم في {new Date(profile.createdAt).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
              
              {/* إحصائيات */}
              <div className="flex items-center space-x-6 mb-4">
                <button
                  onClick={() => {
                    setFollowersType('following')
                    setShowFollowersModal(true)
                  }}
                  className="hover:underline"
                >
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {profile.followingCount}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 mr-1">
                    يتابع
                  </span>
                </button>
                
                <button
                  onClick={() => {
                    setFollowersType('followers')
                    setShowFollowersModal(true)
                  }}
                  className="hover:underline"
                >
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {profile.followersCount}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 mr-1">
                    متابع
                  </span>
                </button>
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex items-center space-x-3">
              {isOwnProfile ? (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                  <span>تحرير الملف</span>
                </button>
              ) : (
                <>
                  <motion.button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`
                      px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2
                      ${isFollowing 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                      }
                      ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    whileHover={{ scale: followLoading ? 1 : 1.02 }}
                    whileTap={{ scale: followLoading ? 1 : 0.98 }}
                  >
                    {followLoading ? (
                      <LoadingSpinner size="small" />
                    ) : isFollowing ? (
                      <UserMinusIcon className="w-5 h-5" />
                    ) : (
                      <UserPlusIcon className="w-5 h-5" />
                    )}
                    <span>{isFollowing ? 'إلغاء المتابعة' : 'متابعة'}</span>
                  </motion.button>
                  
                  <button
                    onClick={handleStartChat}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <ChatBubbleLeftIcon className="w-5 h-5" />
                    <span>رسالة</span>
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="btn-secondary p-2"
                  >
                    <ShareIcon className="w-5 h-5" />
                  </button>
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                      className="btn-secondary p-2"
                    >
                      <EllipsisHorizontalIcon className="w-5 h-5" />
                    </button>
                    
                    <AnimatePresence>
                      {showOptionsMenu && (
                        <motion.div
                          className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg border dark:border-gray-600 z-20 min-w-48"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <button
                            onClick={() => {
                              handleReport('spam', 'محتوى مزعج')
                              setShowOptionsMenu(false)
                            }}
                            className="w-full px-4 py-2 text-right hover:bg-gray-50 dark:hover:bg-gray-600 text-orange-600 first:rounded-t-lg"
                          >
                            <ExclamationTriangleIcon className="w-4 h-4 inline ml-2" />
                            إبلاغ
                          </button>
                          <button
                            onClick={() => {
                              handleBlock()
                              setShowOptionsMenu(false)
                            }}
                            className="w-full px-4 py-2 text-right hover:bg-gray-50 dark:hover:bg-gray-600 text-red-600 last:rounded-b-lg"
                          >
                            حظر
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* علامات التبويب */}
        <div className="mx-4 mt-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    py-4 px-1 border-b-2 flex items-center space-x-2 font-medium text-sm
                    ${activeTab === tab.key
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <span>{tab.label}</span>
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* محتوى التبويبات */}
        <div className="mx-4 mt-6 pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'posts' && (
              <motion.div
                key="posts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {postsLoading ? (
                  <LoadingSpinner text="جاري تحميل المنشورات..." />
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <EmptyState
                    icon="📝"
                    title="لا توجد منشورات"
                    description={
                      isOwnProfile 
                        ? "لم تقم بنشر أي منشورات بعد"
                        : `${profile.firstName} لم ينشر أي منشورات بعد`
                    }
                    actionText={isOwnProfile ? "إنشاء منشور" : undefined}
                    onAction={isOwnProfile ? () => navigate('/') : undefined}
                  />
                )}
              </motion.div>
            )}

            {activeTab === 'media' && (
              <motion.div
                key="media"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PhotoGallery userId={profile.id} />
              </motion.div>
            )}

            {activeTab === 'likes' && (
              <motion.div
                key="likes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {postsLoading ? (
                  <LoadingSpinner text="جاري تحميل الإعجابات..." />
                ) : posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <EmptyState
                    icon="❤️"
                    title="لا توجد إعجابات"
                    description={
                      isOwnProfile 
                        ? "لم تقم بالإعجاب بأي منشورات بعد"
                        : `${profile.firstName} لم يعجب بأي منشورات بعد`
                    }
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* النوافذ المنبثقة */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={profile}
      />
      
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={profile.id}
        type={followersType}
      />
    </div>
  )
}

export default ProfilePage