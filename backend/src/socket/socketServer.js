const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const { User, Message, Conversation, Notification, Post } = require('../models')
const { Op } = require('sequelize')

class SocketServer {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    })

    this.connectedUsers = new Map() // userId -> socketId
    this.userSockets = new Map() // socketId -> userInfo
    this.typingUsers = new Map() // conversationId -> Set of userIds
    this.activeRooms = new Map() // roomId -> Set of userIds

    this.setupMiddleware()
    this.setupEventHandlers()
  }

  // إعداد Middleware للمصادقة
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]
        
        if (!token) {
          throw new Error('لا يوجد رمز مصادقة')
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await User.findByPk(decoded.userId, {
          attributes: ['id', 'firstName', 'lastName', 'username', 'avatar', 'isOnline']
        })

        if (!user) {
          throw new Error('المستخدم غير موجود')
        }

        socket.userId = user.id
        socket.userInfo = user
        next()
      } catch (error) {
        console.error('Socket authentication error:', error.message)
        next(new Error('فشل في المصادقة'))
      }
    })
  }

  // إعداد معالجات الأحداث
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`مستخدم متصل: ${socket.userInfo.username} (${socket.id})`)
      
      this.handleUserConnection(socket)
      this.setupMessageHandlers(socket)
      this.setupPostHandlers(socket)
      this.setupNotificationHandlers(socket)
      this.setupLiveStreamHandlers(socket)
      this.setupCallHandlers(socket)
      
      socket.on('disconnect', () => this.handleUserDisconnection(socket))
    })
  }

  // معالجة اتصال المستخدم
  async handleUserConnection(socket) {
    const userId = socket.userId
    const userInfo = socket.userInfo

    // تحديث حالة الاتصال
    this.connectedUsers.set(userId, socket.id)
    this.userSockets.set(socket.id, userInfo)

    // تحديث حالة المستخدم في قاعدة البيانات
    await User.update(
      { isOnline: true, lastSeen: new Date() },
      { where: { id: userId } }
    )

    // الانضمام للغرف الشخصية
    socket.join(`user-${userId}`)

    // إشعار الأصدقاء بالاتصال
    const friends = await this.getUserFriends(userId)
    friends.forEach(friendId => {
      socket.to(`user-${friendId}`).emit('user-online', {
        userId,
        user: userInfo
      })
    })

    // إرسال قائمة المستخدمين المتصلين
    const onlineUsers = Array.from(this.connectedUsers.keys())
    socket.emit('online-users', onlineUsers)
  }

  // معالجة قطع الاتصال
  async handleUserDisconnection(socket) {
    const userId = socket.userId
    const userInfo = socket.userInfo

    if (!userId) return

    console.log(`مستخدم منقطع: ${userInfo.username} (${socket.id})`)

    // إزالة من الخرائط
    this.connectedUsers.delete(userId)
    this.userSockets.delete(socket.id)

    // إزالة من حالات الكتابة
    this.typingUsers.forEach((users, conversationId) => {
      if (users.has(userId)) {
        users.delete(userId)
        socket.to(`conversation-${conversationId}`).emit('typing-stop', { userId })
      }
    })

    // تحديث حالة المستخدم في قاعدة البيانات
    await User.update(
      { isOnline: false, lastSeen: new Date() },
      { where: { id: userId } }
    )

    // إشعار الأصدقاء بقطع الاتصال
    const friends = await this.getUserFriends(userId)
    friends.forEach(friendId => {
      socket.to(`user-${friendId}`).emit('user-offline', {
        userId,
        lastSeen: new Date()
      })
    })
  }

  // معالجات الرسائل
  setupMessageHandlers(socket) {
    const userId = socket.userId

    // الانضمام لمحادثة
    socket.on('join-conversation', async (conversationId) => {
      try {
        // التحقق من الإذن
        const conversation = await Conversation.findOne({
          where: {
            id: conversationId,
            '$participants.id$': userId
          },
          include: [{
            model: User,
            as: 'participants',
            through: { attributes: [] }
          }]
        })

        if (!conversation) {
          socket.emit('error', { message: 'لا يمكن الوصول لهذه المحادثة' })
          return
        }

        socket.join(`conversation-${conversationId}`)
        socket.currentConversation = conversationId

        // تحديد الرسائل كمقروءة
        await Message.update(
          { isRead: true },
          {
            where: {
              conversationId,
              senderId: { [Op.ne]: userId },
              isRead: false
            }
          }
        )

        socket.emit('joined-conversation', { conversationId })
        console.log(`${socket.userInfo.username} انضم للمحادثة ${conversationId}`)
      } catch (error) {
        console.error('خطأ في الانضمام للمحادثة:', error)
        socket.emit('error', { message: 'فشل في الانضمام للمحادثة' })
      }
    })

    // مغادرة محادثة
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation-${conversationId}`)
      socket.currentConversation = null
      console.log(`${socket.userInfo.username} غادر المحادثة ${conversationId}`)
    })

    // إرسال رسالة
    socket.on('send-message', async (data) => {
      try {
        const { conversationId, content, type = 'text', attachments = [] } = data

        // إنشاء الرسالة في قاعدة البيانات
        const message = await Message.create({
          conversationId,
          senderId: userId,
          content,
          type,
          attachments,
          isRead: false
        })

        // جلب بيانات المرسل
        const messageWithSender = await Message.findByPk(message.id, {
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'firstName', 'lastName', 'username', 'avatar']
          }]
        })

        // إرسال للمحادثة
        this.io.to(`conversation-${conversationId}`).emit('new-message', {
          message: messageWithSender,
          conversationId
        })

        // تحديث آخر رسالة في المحادثة
        await Conversation.update(
          { 
            lastMessageId: message.id,
            updatedAt: new Date()
          },
          { where: { id: conversationId } }
        )

        console.log(`رسالة جديدة من ${socket.userInfo.username} في المحادثة ${conversationId}`)
      } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error)
        socket.emit('error', { message: 'فشل في إرسال الرسالة' })
      }
    })

    // بداية الكتابة
    socket.on('typing-start', (conversationId) => {
      if (!this.typingUsers.has(conversationId)) {
        this.typingUsers.set(conversationId, new Set())
      }
      
      this.typingUsers.get(conversationId).add(userId)
      
      socket.to(`conversation-${conversationId}`).emit('typing-start', {
        userId,
        user: socket.userInfo
      })
    })

    // انتهاء الكتابة
    socket.on('typing-stop', (conversationId) => {
      if (this.typingUsers.has(conversationId)) {
        this.typingUsers.get(conversationId).delete(userId)
      }
      
      socket.to(`conversation-${conversationId}`).emit('typing-stop', {
        userId
      })
    })

    // تحديد الرسالة كمقروءة
    socket.on('mark-message-read', async (data) => {
      try {
        const { messageId, conversationId } = data
        
        await Message.update(
          { isRead: true },
          { where: { id: messageId } }
        )

        socket.to(`conversation-${conversationId}`).emit('message-read', {
          messageId,
          userId
        })
      } catch (error) {
        console.error('خطأ في تحديد الرسالة كمقروءة:', error)
      }
    })
  }

  // معالجات المنشورات
  setupPostHandlers(socket) {
    const userId = socket.userId

    // منشور جديد
    socket.on('new-post', async (postData) => {
      try {
        // إشعار المتابعين
        const followers = await this.getUserFollowers(userId)
        
        followers.forEach(followerId => {
          socket.to(`user-${followerId}`).emit('new-post-notification', {
            post: postData,
            author: socket.userInfo
          })
        })

        console.log(`منشور جديد من ${socket.userInfo.username}`)
      } catch (error) {
        console.error('خطأ في إشعار المنشور الجديد:', error)
      }
    })

    // إعجاب بمنشور
    socket.on('like-post', async (data) => {
      try {
        const { postId, postAuthorId } = data
        
        // إشعار صاحب المنشور
        if (postAuthorId !== userId) {
          socket.to(`user-${postAuthorId}`).emit('post-liked', {
            postId,
            likedBy: {
              id: userId,
              user: socket.userInfo
            }
          })
        }

        // إشعار للمنشور نفسه (للمتفاعلين)
        socket.to(`post-${postId}`).emit('post-like-update', {
          postId,
          userId,
          action: 'like'
        })
      } catch (error) {
        console.error('خطأ في إعجاب المنشور:', error)
      }
    })

    // تعليق على منشور
    socket.on('comment-post', async (data) => {
      try {
        const { postId, postAuthorId, comment } = data
        
        // إشعار صاحب المنشور
        if (postAuthorId !== userId) {
          socket.to(`user-${postAuthorId}`).emit('post-commented', {
            postId,
            comment,
            commentedBy: {
              id: userId,
              user: socket.userInfo
            }
          })
        }

        // إشعار للمنشور نفسه
        socket.to(`post-${postId}`).emit('new-comment', {
          postId,
          comment: {
            ...comment,
            author: socket.userInfo
          }
        })
      } catch (error) {
        console.error('خطأ في تعليق المنشور:', error)
      }
    })
  }

  // معالجات الإشعارات
  setupNotificationHandlers(socket) {
    const userId = socket.userId

    // إشعار جديد
    socket.on('send-notification', async (data) => {
      try {
        const { recipientId, type, title, body, data: notificationData } = data

        // إنشاء الإشعار في قاعدة البيانات
        const notification = await Notification.create({
          userId: recipientId,
          senderId: userId,
          type,
          title,
          body,
          data: notificationData,
          isRead: false
        })

        // إرسال الإشعار للمستلم
        socket.to(`user-${recipientId}`).emit('new-notification', {
          notification: {
            ...notification.toJSON(),
            sender: socket.userInfo
          }
        })

        console.log(`إشعار جديد من ${socket.userInfo.username} إلى ${recipientId}`)
      } catch (error) {
        console.error('خطأ في إرسال الإشعار:', error)
      }
    })

    // تحديد الإشعار كمقروء
    socket.on('mark-notification-read', async (notificationId) => {
      try {
        await Notification.update(
          { isRead: true },
          { where: { id: notificationId, userId } }
        )

        socket.emit('notification-read', { notificationId })
      } catch (error) {
        console.error('خطأ في تحديد الإشعار كمقروء:', error)
      }
    })
  }

  // معالجات البث المباشر
  setupLiveStreamHandlers(socket) {
    const userId = socket.userId

    // بدء بث مباشر
    socket.on('start-live-stream', async (streamData) => {
      try {
        const { title, description, isPrivate = false } = streamData
        const streamId = `stream-${userId}-${Date.now()}`

        // إنشاء غرفة البث
        socket.join(streamId)
        
        // إشعار المتابعين
        if (!isPrivate) {
          const followers = await this.getUserFollowers(userId)
          followers.forEach(followerId => {
            socket.to(`user-${followerId}`).emit('live-stream-started', {
              streamId,
              streamer: socket.userInfo,
              title,
              description
            })
          })
        }

        socket.streamId = streamId
        socket.emit('live-stream-created', { streamId })
        
        console.log(`بث مباشر جديد: ${streamId} من ${socket.userInfo.username}`)
      } catch (error) {
        console.error('خطأ في بدء البث المباشر:', error)
        socket.emit('error', { message: 'فشل في بدء البث المباشر' })
      }
    })

    // الانضمام لبث مباشر
    socket.on('join-live-stream', (streamId) => {
      socket.join(streamId)
      socket.to(streamId).emit('viewer-joined', {
        userId,
        user: socket.userInfo
      })
      
      console.log(`${socket.userInfo.username} انضم للبث ${streamId}`)
    })

    // مغادرة بث مباشر
    socket.on('leave-live-stream', (streamId) => {
      socket.leave(streamId)
      socket.to(streamId).emit('viewer-left', {
        userId
      })
      
      console.log(`${socket.userInfo.username} غادر البث ${streamId}`)
    })

    // إنهاء البث المباشر
    socket.on('end-live-stream', (streamId) => {
      this.io.to(streamId).emit('live-stream-ended', {
        streamId,
        streamer: socket.userInfo
      })
      
      socket.streamId = null
      console.log(`انتهى البث المباشر: ${streamId}`)
    })

    // رسالة في البث المباشر
    socket.on('live-stream-message', (data) => {
      const { streamId, message } = data
      
      socket.to(streamId).emit('live-stream-message', {
        message,
        user: socket.userInfo,
        timestamp: new Date()
      })
    })
  }

  // معالجات المكالمات
  setupCallHandlers(socket) {
    const userId = socket.userId

    // بدء مكالمة
    socket.on('start-call', async (data) => {
      try {
        const { recipientId, type = 'audio' } = data // audio, video
        
        const callId = `call-${userId}-${recipientId}-${Date.now()}`
        
        // إشعار المستلم
        socket.to(`user-${recipientId}`).emit('incoming-call', {
          callId,
          caller: socket.userInfo,
          type
        })

        socket.callId = callId
        socket.emit('call-initiated', { callId })
        
        console.log(`مكالمة ${type} من ${socket.userInfo.username} إلى ${recipientId}`)
      } catch (error) {
        console.error('خطأ في بدء المكالمة:', error)
      }
    })

    // قبول مكالمة
    socket.on('accept-call', (data) => {
      const { callId, callerId } = data
      
      socket.join(`call-${callId}`)
      socket.to(`user-${callerId}`).emit('call-accepted', {
        callId,
        acceptedBy: socket.userInfo
      })
      
      console.log(`${socket.userInfo.username} قبل المكالمة ${callId}`)
    })

    // رفض مكالمة
    socket.on('reject-call', (data) => {
      const { callId, callerId } = data
      
      socket.to(`user-${callerId}`).emit('call-rejected', {
        callId,
        rejectedBy: socket.userInfo
      })
      
      console.log(`${socket.userInfo.username} رفض المكالمة ${callId}`)
    })

    // إنهاء مكالمة
    socket.on('end-call', (callId) => {
      this.io.to(`call-${callId}`).emit('call-ended', {
        callId,
        endedBy: socket.userInfo
      })
      
      socket.callId = null
      console.log(`انتهت المكالمة ${callId}`)
    })

    // WebRTC signaling
    socket.on('webrtc-offer', (data) => {
      const { callId, offer, recipientId } = data
      socket.to(`user-${recipientId}`).emit('webrtc-offer', {
        offer,
        callId,
        from: userId
      })
    })

    socket.on('webrtc-answer', (data) => {
      const { callId, answer, recipientId } = data
      socket.to(`user-${recipientId}`).emit('webrtc-answer', {
        answer,
        callId,
        from: userId
      })
    })

    socket.on('webrtc-ice-candidate', (data) => {
      const { callId, candidate, recipientId } = data
      socket.to(`user-${recipientId}`).emit('webrtc-ice-candidate', {
        candidate,
        callId,
        from: userId
      })
    })
  }

  // دوال مساعدة
  async getUserFriends(userId) {
    // منطق جلب الأصدقاء
    // يمكن تخصيصه حسب نموذج قاعدة البيانات
    return []
  }

  async getUserFollowers(userId) {
    // منطق جلب المتابعين
    try {
      const followers = await User.findAll({
        include: [{
          model: User,
          as: 'following',
          where: { id: userId },
          through: { attributes: [] }
        }],
        attributes: ['id']
      })
      
      return followers.map(follower => follower.id)
    } catch (error) {
      console.error('خطأ في جلب المتابعين:', error)
      return []
    }
  }

  // إرسال إشعار للمستخدم
  sendNotificationToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId)
    if (socketId) {
      this.io.to(socketId).emit('notification', notification)
    }
  }

  // إرسال إشعار لعدة مستخدمين
  sendNotificationToUsers(userIds, notification) {
    userIds.forEach(userId => {
      this.sendNotificationToUser(userId, notification)
    })
  }

  // الحصول على المستخدمين المتصلين
  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys())
  }

  // إحصائيات الخادم
  getServerStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeConversations: this.typingUsers.size,
      activeRooms: this.activeRooms.size,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
  }
}

module.exports = SocketServer