const express = require('express');
const { Op } = require('sequelize');
const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const { adminAuth, moderatorAuth } = require('../middleware/auth');
const router = express.Router();

// إحصائيات عامة للوحة التحكم
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const stats = await Promise.all([
      // إحصائيات المستخدمين
      User.count(),
      User.count({ where: { isActive: true } }),
      User.count({ where: { isVerified: true } }),
      User.count({ where: { isBanned: true } }),
      User.count({ 
        where: { 
          createdAt: { 
            [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) 
          } 
        } 
      }),

      // إحصائيات المنشورات
      Post.count(),
      Post.count({ where: { isDeleted: false } }),
      Post.count({ 
        where: { 
          createdAt: { 
            [Op.gte]: new Date(new Date() - 24 * 60 * 60 * 1000) 
          } 
        } 
      }),

      // إحصائيات البلاغات
      Report.count(),
      Report.count({ where: { status: 'pending' } }),
      Report.count({ where: { status: 'resolved' } })
    ]);

    const dashboardStats = {
      users: {
        total: stats[0],
        active: stats[1],
        verified: stats[2],
        banned: stats[3],
        newThisMonth: stats[4]
      },
      posts: {
        total: stats[5],
        active: stats[6],
        todayPosts: stats[7]
      },
      reports: {
        total: stats[8],
        pending: stats[9],
        resolved: stats[10]
      }
    };

    // إحصائيات التفاعل الشهرية
    const monthlyStats = await Post.findAll({
      attributes: [
        [require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('created_at')), 'month'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'posts'],
        [require('sequelize').fn('SUM', require('sequelize').col('likes_count')), 'totalLikes'],
        [require('sequelize').fn('SUM', require('sequelize').col('comments_count')), 'totalComments']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 12))
        }
      },
      group: [require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('created_at'))],
      order: [[require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('created_at')), 'ASC']]
    });

    res.json({
      success: true,
      data: {
        overview: dashboardStats,
        monthlyStats
      }
    });
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الإدارة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// إدارة المستخدمين
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, filter, sort = 'createdAt' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    // البحث
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // الفلترة
    switch (filter) {
      case 'verified':
        whereClause.isVerified = true;
        break;
      case 'banned':
        whereClause.isBanned = true;
        break;
      case 'inactive':
        whereClause.isActive = false;
        break;
      case 'new':
        whereClause.createdAt = {
          [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000)
        };
        break;
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password', 'twoFactorSecret'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort, 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(users.count / limit),
          totalUsers: users.count,
          hasNext: offset + limit < users.count,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// منح/إلغاء العلامة الزرقاء
router.patch('/users/:id/verify', adminAuth, async (req, res) => {
  try {
    const { isVerified, verificationLevel, reason } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    user.isVerified = isVerified;
    if (verificationLevel) {
      user.verificationLevel = verificationLevel;
    }
    await user.save();

    // تسجيل الإجراء
    const AdminLog = require('../models/AdminLog');
    await AdminLog.create({
      adminId: req.user.userId,
      action: isVerified ? 'verify_user' : 'unverify_user',
      targetUserId: user.id,
      details: { reason, verificationLevel }
    });

    res.json({
      success: true,
      message: `تم ${isVerified ? 'منح' : 'إلغاء'} العلامة الزرقاء بنجاح`
    });
  } catch (error) {
    console.error('خطأ في تحديث التحقق:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// حظر/إلغاء حظر مستخدم
router.patch('/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const { isBanned, banReason, banDuration } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // منع حظر المدراء الآخرين
    if (['admin', 'super_admin'].includes(user.role) && user.id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'لا يمكن حظر مدير آخر'
      });
    }

    user.isBanned = isBanned;
    user.banReason = isBanned ? banReason : null;
    
    if (isBanned && banDuration) {
      user.banUntil = new Date(Date.now() + banDuration * 24 * 60 * 60 * 1000);
    } else {
      user.banUntil = null;
    }

    await user.save();

    // تسجيل الإجراء
    const AdminLog = require('../models/AdminLog');
    await AdminLog.create({
      adminId: req.user.userId,
      action: isBanned ? 'ban_user' : 'unban_user',
      targetUserId: user.id,
      details: { banReason, banDuration }
    });

    res.json({
      success: true,
      message: `تم ${isBanned ? 'حظر' : 'إلغاء حظر'} المستخدم بنجاح`
    });
  } catch (error) {
    console.error('خطأ في حظر المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// إدارة المنشورات
router.get('/posts', moderatorAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, filter, sort = 'createdAt' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    switch (filter) {
      case 'reported':
        whereClause.isReported = true;
        break;
      case 'deleted':
        whereClause.isDeleted = true;
        break;
      case 'popular':
        // المنشورات الشائعة
        break;
    }

    const posts = await Post.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'isVerified']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort, 'DESC']]
    });

    res.json({
      success: true,
      data: {
        posts: posts.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(posts.count / limit),
          totalPosts: posts.count,
          hasNext: offset + limit < posts.count,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب المنشورات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// حذف منشور (إداري)
router.delete('/posts/:id', moderatorAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    // تسجيل الإجراء
    const AdminLog = require('../models/AdminLog');
    await AdminLog.create({
      adminId: req.user.userId,
      action: 'delete_post',
      targetPostId: post.id,
      details: { reason }
    });

    res.json({
      success: true,
      message: 'تم حذف المنشور بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف المنشور:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// إدارة البلاغات
router.get('/reports', moderatorAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const reports = await Report.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'reportedUser', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: Post, as: 'post' },
        { model: User, as: 'reviewer', attributes: ['id', 'username', 'firstName', 'lastName'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        reports: reports.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(reports.count / limit),
          totalReports: reports.count,
          hasNext: offset + limit < reports.count,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('خطأ في جلب البلاغات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// معالجة بلاغ
router.patch('/reports/:id', moderatorAuth, async (req, res) => {
  try {
    const { status, action, actionNote } = req.body;
    const report = await Report.findByPk(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'البلاغ غير موجود'
      });
    }

    report.status = status;
    report.action = action;
    report.actionNote = actionNote;
    report.reviewedBy = req.user.userId;
    report.reviewedAt = new Date();
    await report.save();

    // تنفيذ الإجراء حسب النوع
    if (action && action !== 'none') {
      await executeReportAction(report, action);
    }

    // تسجيل الإجراء
    const AdminLog = require('../models/AdminLog');
    await AdminLog.create({
      adminId: req.user.userId,
      action: 'review_report',
      details: { reportId: report.id, action, status }
    });

    res.json({
      success: true,
      message: 'تم معالجة البلاغ بنجاح'
    });
  } catch (error) {
    console.error('خطأ في معالجة البلاغ:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// دالة مساعدة لتنفيذ إجراءات البلاغ
async function executeReportAction(report, action) {
  switch (action) {
    case 'content_removed':
      if (report.postId) {
        await Post.update(
          { isDeleted: true, deletedAt: new Date() },
          { where: { id: report.postId } }
        );
      }
      break;
    case 'user_suspended':
      if (report.reportedUserId) {
        await User.update(
          { 
            isBanned: true, 
            banReason: 'مخالفة قوانين المجتمع',
            banUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // أسبوع
          },
          { where: { id: report.reportedUserId } }
        );
      }
      break;
    case 'user_banned':
      if (report.reportedUserId) {
        await User.update(
          { 
            isBanned: true, 
            banReason: 'مخالفة جسيمة لقوانين المجتمع',
            isActive: false
          },
          { where: { id: report.reportedUserId } }
        );
      }
      break;
  }
}

module.exports = router;