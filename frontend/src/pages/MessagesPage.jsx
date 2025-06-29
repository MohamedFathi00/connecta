import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

// Icons
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  PhotoIcon,
  MicrophoneIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon,
  EllipsisVerticalIcon,
  CheckIcon,
  CheckCheckIcon
} from '@heroicons/react/24/outline'

// Components
import UserAvatar from '../components/common/UserAvatar'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import EmojiPicker from '../components/common/EmojiPicker'
import MediaPreview from '../components/media/MediaPreview'
import VoiceRecorder from '../components/media/VoiceRecorder'

// Redux
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  setCurrentConversation,
  markAsRead,
  addTypingUser,
  removeTypingUser
} from '../store/slices/messagesSlice'

// Utils
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

const MessagesPage = () => {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  
  const { user } = useSelector(state => state.auth)
  const {
    conversations,
    messages,
    currentConversation,
    loading,
    sending,
    typingUsers,
    onlineUsers
  } = useSelector(state => state.messages)
  
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [showConversationInfo, setShowConversationInfo] = useState(false)
  
  const messagesEndRef = useRef(null)
  const messageInputRef = useRef(null)
  const fileInputRef = useRef(null)

  // جلب المحادثات عند التحميل
  useEffect(() => {
    dispatch(fetchConversations({ page: 1, limit: 50 }))
  }, [dispatch])

  // فتح محادثة محددة من URL
  useEffect(() => {
    const userId = searchParams.get('user')
    if (userId && conversations.length > 0) {
      const conversation = conversations.find(c => 
        c.participants.some(p => p.username === userId)
      )
      if (conversation) {
        handleSelectConversation(conversation)
      }
    }
  }, [searchParams, conversations])

  // جلب الرسائل عند تغيير المحادثة
  useEffect(() => {
    if (selectedConversation) {
      dispatch(fetchMessages({
        conversationId: selectedConversation.id,
        page: 1,
        limit: 50
      }))
      dispatch(setCurrentConversation(selectedConversation))
    }
  }, [selectedConversation, dispatch])

  // التمرير للأسفل عند إضافة رسائل جديدة
  useEffect(() => {
    scrollToBottom()
  }, [messages[selectedConversation?.id]])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // اختيار محادثة
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation)
    
    // تحديد الرسائل كمقروءة
    const unreadMessages = messages[conversation.id]?.filter(m => 
      !m.isRead && m.senderId !== user.id
    )
    
    if (unreadMessages?.length > 0) {
      unreadMessages.forEach(message => {
        dispatch(markAsRead({
          conversationId: conversation.id,
          messageId: message.id
        }))
      })
    }
  }

  // إرسال رسالة
  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if ((!messageText.trim() && attachments.length === 0) || !selectedConversation) {
      return
    }

    const messageData = {
      conversationId: selectedConversation.id,
      content: messageText.trim(),
      type: attachments.length > 0 ? 'media' : 'text',
      attachments: attachments.map(att => ({
        type: att.type,
        url: att.url,
        name: att.name
      }))
    }

    try {
      await dispatch(sendMessage(messageData))
      setMessageText('')
      setAttachments([])
      scrollToBottom()
    } catch (error) {
      toast.error('فشل في إرسال الرسالة')
    }
  }

  // إضافة إيموجي
  const addEmoji = (emoji) => {
    const input = messageInputRef.current
    if (input) {
      const start = input.selectionStart
      const end = input.selectionEnd
      const newText = messageText.slice(0, start) + emoji + messageText.slice(end)
      setMessageText(newText)
      
      setTimeout(() => {
        input.focus()
        input.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    }
  }

  // معالجة الملفات
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setAttachments(prev => [...prev, {
          id: Date.now() + Math.random(),
          file,
          url: event.target.result,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          name: file.name
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  // إزالة مرفق
  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  // فلترة المحادثات
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true
    
    const otherParticipant = conversation.participants.find(p => p.id !== user.id)
    const searchLower = searchQuery.toLowerCase()
    
    return (
      otherParticipant?.firstName?.toLowerCase().includes(searchLower) ||
      otherParticipant?.lastName?.toLowerCase().includes(searchLower) ||
      otherParticipant?.username?.toLowerCase().includes(searchLower) ||
      conversation.lastMessage?.content?.toLowerCase().includes(searchLower)
    )
  })

  // تنسيق الوقت
  const formatTime = (date) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ar 
    })
  }

  // رسائل المحادثة الحالية
  const currentMessages = selectedConversation 
    ? messages[selectedConversation.id] || []
    : []

  // المستخدمون الذين يكتبون
  const currentTypingUsers = selectedConversation 
    ? typingUsers[selectedConversation.id] || []
    : []

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex">
      
      {/* قائمة المحادثات */}
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        
        {/* رأس قائمة المحادثات */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              الرسائل
            </h1>
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <PlusIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {/* شريط البحث */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="البحث في المحادثات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600"
            />
          </div>
        </div>

        {/* قائمة المحادثات */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4">
              <LoadingSpinner text="جاري تحميل المحادثات..." />
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredConversations.map((conversation) => {
                const otherParticipant = conversation.participants.find(p => p.id !== user.id)
                const isSelected = selectedConversation?.id === conversation.id
                const isOnline = onlineUsers.includes(otherParticipant?.id)
                
                return (
                  <motion.div
                    key={conversation.id}
                    className={`
                      p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700
                      ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}
                    `}
                    onClick={() => handleSelectConversation(conversation)}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <UserAvatar 
                          user={otherParticipant} 
                          size="medium"
                          showOnline={true}
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {otherParticipant?.firstName} {otherParticipant?.lastName}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {conversation.lastMessage && formatTime(conversation.lastMessage.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {conversation.lastMessage?.content || 'لا توجد رسائل'}
                          </p>
                          
                          {conversation.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon="💬"
              title="لا توجد محادثات"
              description="ابدأ محادثة جديدة مع أصدقائك"
              size="small"
            />
          )}
        </div>
      </div>

      {/* منطقة المحادثة */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* رأس المحادثة */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserAvatar 
                    user={selectedConversation.participants.find(p => p.id !== user.id)} 
                    size="medium"
                    showOnline={true}
                  />
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.participants.find(p => p.id !== user.id)?.firstName}{' '}
                      {selectedConversation.participants.find(p => p.id !== user.id)?.lastName}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {onlineUsers.includes(selectedConversation.participants.find(p => p.id !== user.id)?.id) 
                        ? 'متصل الآن' 
                        : 'غير متصل'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <PhoneIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <VideoCameraIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button 
                    onClick={() => setShowConversationInfo(!showConversationInfo)}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <InformationCircleIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* منطقة الرسائل */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentMessages.map((message, index) => {
                const isOwn = message.senderId === user.id
                const showAvatar = index === 0 || 
                  currentMessages[index - 1].senderId !== message.senderId
                
                return (
                  <motion.div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {!isOwn && showAvatar && (
                        <UserAvatar 
                          user={selectedConversation.participants.find(p => p.id === message.senderId)} 
                          size="small"
                        />
                      )}
                      
                      <div className={`
                        px-4 py-2 rounded-lg shadow-sm
                        ${isOwn 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                        }
                      `}>
                        {message.type === 'media' && message.attachments?.length > 0 && (
                          <div className="mb-2">
                            {message.attachments.map((attachment, idx) => (
                              <MediaPreview 
                                key={idx}
                                media={attachment}
                                className="rounded-lg overflow-hidden"
                              />
                            ))}
                          </div>
                        )}
                        
                        {message.content && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                        
                        <div className={`flex items-center justify-between mt-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <span className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {new Date(message.createdAt).toLocaleTimeString('ar-SA', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          
                          {isOwn && (
                            <div className="flex items-center">
                              {message.isRead ? (
                                <CheckCheckIcon className="w-4 h-4 text-blue-100" />
                              ) : (
                                <CheckIcon className="w-4 h-4 text-blue-200" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {!isOwn && !showAvatar && (
                        <div className="w-8" />
                      )}
                    </div>
                  </motion.div>
                )
              })}
              
              {/* مؤشر الكتابة */}
              <AnimatePresence>
                {currentTypingUsers.length > 0 && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">يكتب...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div ref={messagesEndRef} />
            </div>

            {/* المرفقات */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <div className="flex space-x-3 overflow-x-auto">
                    {attachments.map((attachment) => (
                      <MediaPreview
                        key={attachment.id}
                        media={attachment}
                        onRemove={() => removeAttachment(attachment.id)}
                        className="flex-shrink-0"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* منطقة الكتابة */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                
                {/* أدوات إضافية */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <PhotoIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FaceSmileIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
                  
                  <VoiceRecorder
                    isRecording={isRecording}
                    onStartRecording={() => setIsRecording(true)}
                    onStopRecording={(audioBlob) => {
                      setIsRecording(false)
                      // معالجة الصوت المسجل
                    }}
                  />
                </div>

                {/* حقل النص */}
                <div className="flex-1">
                  <textarea
                    ref={messageInputRef}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                    placeholder="اكتب رسالة..."
                    className="w-full max-h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows="1"
                  />
                </div>

                {/* زر الإرسال */}
                <button
                  type="submit"
                  disabled={sending || (!messageText.trim() && attachments.length === 0)}
                  className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <LoadingSpinner size="small" />
                  ) : (
                    <PaperAirplaneIcon className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon="💬"
              title="اختر محادثة"
              description="اختر محادثة من القائمة لبدء المراسلة"
            />
          </div>
        )}
      </div>

      {/* Input مخفي للملفات */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

export default MessagesPage