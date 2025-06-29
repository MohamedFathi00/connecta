import React, { useState, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

// Icons
import { 
  PhotoIcon, 
  VideoCameraIcon,
  MicrophoneIcon,
  MapPinIcon,
  FaceSmileIcon,
  GlobeAltIcon,
  LockClosedIcon,
  UserGroupIcon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

// Components
import UserAvatar from '../common/UserAvatar'
import LoadingSpinner from '../common/LoadingSpinner'
import MediaPreview from '../media/MediaPreview'
import EmojiPicker from '../common/EmojiPicker'
import LocationPicker from '../common/LocationPicker'

// Utils
import { uploadFile, uploadMultipleFiles } from '../../services/api'

const CreatePost = ({ onSubmit, className = '', isModal = false, onClose }) => {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const { creating } = useSelector(state => state.posts)
  
  const [content, setContent] = useState('')
  const [media, setMedia] = useState([])
  const [visibility, setVisibility] = useState('public') // public, friends, private
  const [location, setLocation] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedAudience, setSelectedAudience] = useState(null)
  
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // معالجة رفع الملفات
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return
    
    setIsUploading(true)
    
    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await uploadFile(file, (progress) => {
          setUploadProgress(progress)
        })
        
        return {
          id: Date.now() + Math.random(),
          file,
          url: response.data.url,
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' : 'file',
          size: file.size,
          name: file.name
        }
      })
      
      const uploadedFiles = await Promise.all(uploadPromises)
      setMedia(prev => [...prev, ...uploadedFiles])
      
      toast.success('تم رفع الملفات بنجاح')
    } catch (error) {
      console.error('خطأ في رفع الملفات:', error)
      toast.error('فشل في رفع الملفات')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.gif', '.jpeg', '.jpg'],
      'video/*': ['.mp4', '.webm', '.mov'],
      'audio/*': ['.mp3', '.wav', '.ogg']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true
  })

  // معالجة إرسال المنشور
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim() && media.length === 0) {
      toast.error('يرجى كتابة شيء أو إضافة وسائط')
      return
    }

    const postData = {
      content: content.trim(),
      media: media.map(m => ({
        url: m.url,
        type: m.type,
        name: m.name
      })),
      visibility,
      location,
      hashtags: extractHashtags(content),
      mentions: extractMentions(content)
    }

    try {
      await onSubmit(postData)
      
      // إعادة تعيين النموذج
      setContent('')
      setMedia([])
      setLocation(null)
      setVisibility('public')
      
      toast.success('تم نشر المنشور بنجاح!')
      
      if (isModal && onClose) {
        onClose()
      }
    } catch (error) {
      console.error('خطأ في نشر المنشور:', error)
      toast.error('فشل في نشر المنشور')
    }
  }

  // استخراج الهاشتاغات
  const extractHashtags = (text) => {
    const hashtagRegex = /#[\u0600-\u06FFa-zA-Z0-9_]+/g
    const matches = text.match(hashtagRegex)
    return matches ? matches.map(tag => tag.slice(1)) : []
  }

  // استخراج الإشارات
  const extractMentions = (text) => {
    const mentionRegex = /@[a-zA-Z0-9_]+/g
    const matches = text.match(mentionRegex)
    return matches ? matches.map(mention => mention.slice(1)) : []
  }

  // إزالة وسائط
  const removeMedia = (id) => {
    setMedia(prev => prev.filter(m => m.id !== id))
  }

  // إضافة إيموجي
  const addEmoji = (emoji) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.slice(0, start) + emoji + content.slice(end)
      setContent(newContent)
      
      // إعادة تركيز المؤشر
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    }
  }

  // إعدادات الرؤية
  const visibilityOptions = [
    {
      key: 'public',
      label: 'عام',
      description: 'يمكن لأي شخص رؤيته',
      icon: GlobeAltIcon
    },
    {
      key: 'friends',
      label: 'الأصدقاء',
      description: 'الأصدقاء فقط',
      icon: UserGroupIcon
    },
    {
      key: 'private',
      label: 'خاص',
      description: 'أنت فقط',
      icon: LockClosedIcon
    }
  ]

  const currentVisibility = visibilityOptions.find(opt => opt.key === visibility)

  return (
    <motion.div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-soft ${isModal ? '' : 'mb-6'} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit} className="p-6">
        {/* رأس النموذج */}
        <div className="flex items-center space-x-4 mb-4">
          <UserAvatar user={user} size="medium" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </h3>
            
            {/* اختيار الرؤية */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mt-1"
                onClick={() => setSelectedAudience(!selectedAudience)}
              >
                <currentVisibility.icon className="w-4 h-4" />
                <span>{currentVisibility.label}</span>
              </button>
              
              <AnimatePresence>
                {selectedAudience && (
                  <motion.div
                    className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg border dark:border-gray-600 z-20 min-w-48"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {visibilityOptions.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        className="w-full px-4 py-3 text-right hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center space-x-3 first:rounded-t-lg last:rounded-b-lg"
                        onClick={() => {
                          setVisibility(option.key)
                          setSelectedAudience(false)
                        }}
                      >
                        <option.icon className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {option.label}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {option.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {isModal && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* منطقة النص */}
        <div className="mb-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="ما الذي يحدث؟"
            className="w-full p-4 border-none resize-none bg-transparent text-lg placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none"
            rows={3}
            maxLength={2000}
          />
          
          {/* عداد الأحرف */}
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {content.length}/2000
            </div>
            {content.length > 1900 && (
              <div className="text-sm text-orange-500">
                {2000 - content.length} حرف متبقي
              </div>
            )}
          </div>
        </div>

        {/* منطقة السحب والإفلات */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:border-gray-400 dark:hover:border-gray-500'}
            ${media.length > 0 ? 'mb-4' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="py-4">
              <LoadingSpinner size="medium" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                جاري الرفع... {uploadProgress}%
              </p>
            </div>
          ) : (
            <div className="py-4">
              <PlusIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                {isDragActive 
                  ? 'اسحب الملفات هنا...' 
                  : 'اسحب الملفات هنا أو انقر للاختيار'
                }
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                PNG, JPG, GIF, MP4, MP3 (حتى 100MB)
              </p>
            </div>
          )}
        </div>

        {/* معاينة الوسائط */}
        <AnimatePresence>
          {media.length > 0 && (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {media.map((item) => (
                <MediaPreview
                  key={item.id}
                  media={item}
                  onRemove={() => removeMedia(item.id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* الموقع */}
        <AnimatePresence>
          {location && (
            <motion.div
              className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center space-x-2">
                <MapPinIcon className="w-5 h-5 text-red-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {location.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLocation(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* أدوات النشر */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {/* الوسائط */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500"
              title="إضافة صور أو فيديو"
            >
              <PhotoIcon className="w-6 h-6" />
            </button>
            
            {/* الإيموجي */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-yellow-500"
                title="إضافة إيموجي"
              >
                <FaceSmileIcon className="w-6 h-6" />
              </button>
              
              <AnimatePresence>
                {showEmojiPicker && (
                  <EmojiPicker
                    onEmojiSelect={addEmoji}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}
              </AnimatePresence>
            </div>
            
            {/* الموقع */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                title="إضافة موقع"
              >
                <MapPinIcon className="w-6 h-6" />
              </button>
              
              <AnimatePresence>
                {showLocationPicker && (
                  <LocationPicker
                    onLocationSelect={setLocation}
                    onClose={() => setShowLocationPicker(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* زر النشر */}
          <button
            type="submit"
            disabled={creating || (!content.trim() && media.length === 0)}
            className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <>
                <LoadingSpinner size="small" className="ml-2" />
                نشر...
              </>
            ) : (
              'نشر'
            )}
          </button>
        </div>
      </form>

      {/* Input مخفي للملفات */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        onChange={(e) => {
          if (e.target.files) {
            onDrop(Array.from(e.target.files))
          }
        }}
        className="hidden"
      />
    </motion.div>
  )
}

export default CreatePost