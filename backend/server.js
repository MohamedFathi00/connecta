const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware أساسي
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3001'
  ],
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // حد أقصى 100 طلب لكل IP
  message: 'تم تجاوز الحد المسموح من الطلبات، حاول مرة أخرى لاحقاً'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database Connection
const db = require('./config/database');

// Test Database Connection
async function testConnection() {
  try {
    await db.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
  }
}
testConnection();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/media', require('./routes/media'));

// Socket.IO للتفاعل المباشر
io.on('connection', (socket) => {
  console.log('🔗 مستخدم متصل:', socket.id);
  
  // انضمام للغرف
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
  });
  
  // الرسائل المباشرة
  socket.on('direct-message', (data) => {
    socket.to(data.recipientId).emit('new-message', {
      senderId: socket.userId,
      message: data.message,
      timestamp: new Date()
    });
  });
  
  // التفاعل المباشر مع المنشورات
  socket.on('post-interaction', (data) => {
    socket.broadcast.emit('post-updated', data);
  });
  
  // البث المباشر
  socket.on('start-live-stream', (data) => {
    socket.broadcast.emit('live-stream-started', data);
  });
  
  socket.on('disconnect', () => {
    console.log('❌ مستخدم منقطع:', socket.id);
  });
});

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'خطأ في الخادم الداخلي',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
  console.log(`📱 API متاح على: http://localhost:${PORT}/api`);
});

module.exports = { app, io };