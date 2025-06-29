import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { io } from 'socket.io-client'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const { isAuthenticated, user } = useSelector(state => state.auth)

  useEffect(() => {
    if (isAuthenticated && user) {
      // إنشاء اتصال Socket.IO
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: {
          userId: user.id,
          token: localStorage.getItem('token')
        },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      // معالجات الأحداث
      newSocket.on('connect', () => {
        console.log('🔗 متصل بالخادم')
        setIsConnected(true)
      })

      newSocket.on('disconnect', (reason) => {
        console.log('❌ انقطع الاتصال:', reason)
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('خطأ في الاتصال:', error)
        setIsConnected(false)
      })

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 تم إعادة الاتصال بعد', attemptNumber, 'محاولات')
        setIsConnected(true)
      })

      newSocket.on('reconnect_error', (error) => {
        console.error('خطأ في إعادة الاتصال:', error)
      })

      newSocket.on('reconnect_failed', () => {
        console.error('فشل في إعادة الاتصال')
        setIsConnected(false)
      })

      // أحداث التطبيق
      newSocket.on('user-joined', (userId) => {
        console.log('مستخدم انضم:', userId)
      })

      newSocket.on('user-left', (userId) => {
        console.log('مستخدم غادر:', userId)
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
        setSocket(null)
        setIsConnected(false)
      }
    } else {
      // إغلاق الاتصال إذا لم يكن المستخدم مصادق عليه
      if (socket) {
        socket.close()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [isAuthenticated, user])

  // دوال مساعدة للاستخدام في المكونات
  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('join-room', roomId)
    }
  }

  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit('leave-room', roomId)
    }
  }

  const sendMessage = (recipientId, message) => {
    if (socket) {
      socket.emit('direct-message', { recipientId, message })
    }
  }

  const sendPostInteraction = (postId, type, data) => {
    if (socket) {
      socket.emit('post-interaction', { postId, type, data })
    }
  }

  const startLiveStream = (streamData) => {
    if (socket) {
      socket.emit('start-live-stream', streamData)
    }
  }

  const joinLiveStream = (streamId) => {
    if (socket) {
      socket.emit('join-live-stream', streamId)
    }
  }

  const sendTypingIndicator = (recipientId, isTyping) => {
    if (socket) {
      socket.emit('typing', { recipientId, isTyping })
    }
  }

  const updateOnlineStatus = (status) => {
    if (socket) {
      socket.emit('update-status', status)
    }
  }

  const value = {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendPostInteraction,
    startLiveStream,
    joinLiveStream,
    sendTypingIndicator,
    updateOnlineStatus
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketProvider