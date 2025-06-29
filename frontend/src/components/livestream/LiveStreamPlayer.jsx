import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

// Icons
import {
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ShareIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  UserGroupIcon,
  EyeIcon,
  PhoneIcon,
  VideoCameraIcon,
  GiftIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline'

// Components
import UserAvatar from '../common/UserAvatar'
import LoadingSpinner from '../common/LoadingSpinner'
import LiveChat from './LiveChat'
import StreamStats from './StreamStats'
import ViewersList from './ViewersList'

// Hooks
import { useSocket } from '../../hooks/useSocket'
import { useLiveStream } from '../../hooks/useLiveStream'

const LiveStreamPlayer = ({ 
  streamId, 
  streamer, 
  onClose,
  isStreamer = false 
}) => {
  const dispatch = useDispatch()
  const { user } = useSelector(state => state.auth)
  const socket = useSocket()
  
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [showStats, setShowStats] = useState(false)
  const [showViewers, setShowViewers] = useState(false)
  const [volume, setVolume] = useState(1)
  const [quality, setQuality] = useState('auto')
  const [streamStatus, setStreamStatus] = useState('loading') // loading, live, ended, error
  
  const [viewers, setViewers] = useState([])
  const [viewerCount, setViewerCount] = useState(0)
  const [likes, setLikes] = useState(0)
  const [messages, setMessages] = useState([])
  const [isLiked, setIsLiked] = useState(false)
  const [showReactions, setShowReactions] = useState(false)

  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const chatInputRef = useRef(null)
  
  const {
    stream,
    startStream,
    stopStream,
    joinStream,
    leaveStream,
    sendStreamMessage,
    loading: streamLoading
  } = useLiveStream(streamId)

  // الانضمام للبث عند التحميل
  useEffect(() => {
    if (streamId && socket) {
      joinStream(streamId)
      socket.emit('join-live-stream', streamId)
    }

    return () => {
      if (streamId && socket) {
        leaveStream(streamId)
        socket.emit('leave-live-stream', streamId)
      }
    }
  }, [streamId, socket])

  // معالجة أحداث Socket
  useEffect(() => {
    if (!socket) return

    const handleViewerJoined = (data) => {
      setViewers(prev => [...prev, data.user])
      setViewerCount(prev => prev + 1)
      
      if (data.userId !== user.id) {
        toast.success(`${data.user.firstName} انضم للبث`)
      }
    }

    const handleViewerLeft = (data) => {
      setViewers(prev => prev.filter(v => v.id !== data.userId))
      setViewerCount(prev => Math.max(0, prev - 1))
    }

    const handleStreamMessage = (data) => {
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        user: data.user,
        message: data.message,
        timestamp: data.timestamp
      }])
    }

    const handleStreamEnded = () => {
      setStreamStatus('ended')
      toast.info('انتهى البث المباشر')
    }

    const handleStreamError = () => {
      setStreamStatus('error')
      toast.error('حدث خطأ في البث')
    }

    socket.on('viewer-joined', handleViewerJoined)
    socket.on('viewer-left', handleViewerLeft)
    socket.on('live-stream-message', handleStreamMessage)
    socket.on('live-stream-ended', handleStreamEnded)
    socket.on('stream-error', handleStreamError)

    return () => {
      socket.off('viewer-joined', handleViewerJoined)
      socket.off('viewer-left', handleViewerLeft)
      socket.off('live-stream-message', handleStreamMessage)
      socket.off('live-stream-ended', handleStreamEnded)
      socket.off('stream-error', handleStreamError)
    }
  }, [socket, user])

  // التحكم في الفيديو
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
    }
  }

  // ملء الشاشة
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // الإعجاب بالبث
  const handleLike = () => {
    if (!isLiked) {
      setLikes(prev => prev + 1)
      setIsLiked(true)
      
      // إرسال إشعار للمُبث
      if (socket && !isStreamer) {
        socket.emit('stream-reaction', {
          streamId,
          type: 'like',
          user: user
        })
      }
      
      // إظهار الردود
      setShowReactions(true)
      setTimeout(() => setShowReactions(false), 3000)
    }
  }

  // مشاركة البث
  const handleShare = async () => {
    const shareData = {
      title: `بث مباشر من ${streamer.firstName} ${streamer.lastName}`,
      text: 'شاهد هذا البث المباشر الرائع!',
      url: window.location.href
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        navigator.clipboard.writeText(window.location.href)
        toast.success('تم نسخ رابط البث')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('تم نسخ رابط البث')
    }
  }

  // إرسال رسالة في الدردشة
  const handleSendMessage = (message) => {
    if (socket && message.trim()) {
      socket.emit('live-stream-message', {
        streamId,
        message: message.trim()
      })
    }
  }

  // إنهاء البث (للمُبث فقط)
  const handleEndStream = () => {
    if (socket && isStreamer) {
      socket.emit('end-live-stream', streamId)
      stopStream()
      onClose()
    }
  }

  const reactions = ['❤️', '👏', '🔥', '😍', '🎉', '👍']

  if (streamLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <LoadingSpinner size="large" text="جاري تحميل البث..." />
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`
        fixed inset-0 bg-black z-50 flex
        ${isFullscreen ? 'flex-col' : 'flex-row'}
      `}
    >
      {/* منطقة الفيديو */}
      <div className={`relative ${isFullscreen || !showChat ? 'flex-1' : 'flex-1 lg:flex-none lg:w-2/3'}`}>
        
        {/* مشغل الفيديو */}
        <div className="relative w-full h-full bg-black">
          {streamStatus === 'loading' ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="large" text="جاري تحميل البث..." />
            </div>
          ) : streamStatus === 'ended' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">📺</div>
                <h3 className="text-2xl font-bold mb-2">انتهى البث</h3>
                <p className="text-gray-400">شكراً لك على المشاهدة!</p>
              </div>
            </div>
          ) : streamStatus === 'error' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold mb-2">خطأ في البث</h3>
                <p className="text-gray-400">حدث خطأ في تحميل البث</p>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted={isMuted}
              onLoadedData={() => setStreamStatus('live')}
              onError={() => setStreamStatus('error')}
            >
              {/* مصادر الفيديو حسب الجودة */}
              <source src={`${stream?.url}?quality=${quality}`} type="video/mp4" />
            </video>
          )}

          {/* عناصر التحكم العلوية */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
                
                <div className="flex items-center space-x-3">
                  <UserAvatar user={streamer} size="small" />
                  <div>
                    <div className="text-white font-medium">
                      {streamer.firstName} {streamer.lastName}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-white/80 text-sm">مباشر</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 bg-black/30 rounded-full px-3 py-1">
                  <EyeIcon className="w-4 h-4 text-white" />
                  <span className="text-white text-sm">{viewerCount}</span>
                </div>
                
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
                >
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* عناصر التحكم السفلية */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  {isPlaying ? (
                    <PauseIcon className="w-6 h-6" />
                  ) : (
                    <PlayIcon className="w-6 h-6" />
                  )}
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    {isMuted ? (
                      <SpeakerXMarkIcon className="w-5 h-5" />
                    ) : (
                      <SpeakerWaveIcon className="w-5 h-5" />
                    )}
                  </button>
                  
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 accent-white"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLike}
                  className={`p-2 rounded-full transition-colors ${
                    isLiked 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                >
                  <HeartIcon className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => setShowChat(!showChat)}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors lg:hidden"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                </button>
                
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  {isFullscreen ? (
                    <ArrowsPointingInIcon className="w-5 h-5" />
                  ) : (
                    <ArrowsPointingOutIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ردود الأفعال المتحركة */}
          <AnimatePresence>
            {showReactions && (
              <div className="absolute inset-0 pointer-events-none">
                {reactions.map((reaction, index) => (
                  <motion.div
                    key={index}
                    className="absolute text-4xl"
                    initial={{ 
                      bottom: '20%', 
                      left: `${Math.random() * 80 + 10}%`,
                      opacity: 1,
                      scale: 1
                    }}
                    animate={{ 
                      bottom: '80%',
                      opacity: 0,
                      scale: 1.5
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 3, delay: index * 0.2 }}
                  >
                    {reaction}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* أزرار المُبث */}
          {isStreamer && (
            <div className="absolute top-20 right-4 flex flex-col space-y-2">
              <button
                onClick={handleEndStream}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                إنهاء البث
              </button>
              
              <button
                onClick={() => setShowStats(!showStats)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                الإحصائيات
              </button>
            </div>
          )}
        </div>
      </div>

      {/* منطقة الدردشة والتفاعل */}
      <AnimatePresence>
        {showChat && !isFullscreen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="w-full lg:w-80 bg-white dark:bg-gray-900 flex flex-col"
          >
            <LiveChat
              messages={messages}
              onSendMessage={handleSendMessage}
              viewers={viewers}
              viewerCount={viewerCount}
              streamId={streamId}
              isStreamer={isStreamer}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* إحصائيات البث */}
      <AnimatePresence>
        {showStats && (
          <StreamStats
            streamId={streamId}
            viewerCount={viewerCount}
            likes={likes}
            messages={messages.length}
            duration={stream?.duration || 0}
            onClose={() => setShowStats(false)}
          />
        )}
      </AnimatePresence>

      {/* قائمة المشاهدين */}
      <AnimatePresence>
        {showViewers && (
          <ViewersList
            viewers={viewers}
            onClose={() => setShowViewers(false)}
            isStreamer={isStreamer}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default LiveStreamPlayer