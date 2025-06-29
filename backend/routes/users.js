const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');
const router = express.Router();

// الحصول على ملف شخصي للمستخدم
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'twoFactorSecret'] },
      include: [
        {
          model: Post,
          as: 'posts',
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التحقق من إعدادات الخصوصية
    const isOwnProfile = req.user.userId === user.id;
    const privacySettings = user.privacySettings;

    if (!isOwnProfile && privacySettings.profileVisibility === 'private') {
      return res.status(403).json({
        success: false,
        message: 'الملف الشخصي غير متاح'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('خطأ في جلب الملف الشخصي:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// تحديث الملف الشخصي
router.put('/profile', auth, [
  body('firstName').optional().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isLength({ min: 1, max: 50 }),
  body('bio').optional().isLength({ max: 500 }),
  body('location').optional().isLength({ max: 100 }),
  body('website').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'خطأ في البيانات المدخلة',
        errors: errors.array()
      });
    }

    const { firstName, lastName, bio, location, website, privacySettings, preferences } = req.body;

    const user = await User.findByPk(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // تحديث البيانات
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (privacySettings) user.privacySettings = { ...user.privacySettings, ...privacySettings };
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      data: user.toJSON()
    });
  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// متابعة مستخدم
router.post('/follow/:id', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.userId;

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك متابعة نفسك'
      });
    }

    const targetUser = await User.findByPk(targetUserId);
    const currentUser = await User.findByPk(currentUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التحقق من وجود المتابعة مسبقاً
    const Follow = require('../models/Follow');
    const existingFollow = await Follow.findOne({
      where: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    });

    if (existingFollow) {
      return res.status(400).json({
        success: false,
        message: 'تتابع هذا المستخدم بالفعل'
      });
    }

    // إنشاء متابعة جديدة
    await Follow.create({
      followerId: currentUserId,
      followingId: targetUserId
    });

    // تحديث الإحصائيات
    await targetUser.increment('followersCount');
    await currentUser.increment('followingCount');

    res.json({
      success: true,
      message: 'تم متابعة المستخدم بنجاح'
    });
  } catch (error) {
    console.error('خطأ في المتابعة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// إلغاء متابعة مستخدم
router.delete('/unfollow/:id', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.userId;

    const Follow = require('../models/Follow');
    const follow = await Follow.findOne({
      where: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    });

    if (!follow) {
      return res.status(400).json({
        success: false,
        message: 'لا تتابع هذا المستخدم'
      });
    }

    await follow.destroy();

    // تحديث الإحصائيات
    const targetUser = await User.findByPk(targetUserId);
    const currentUser = await User.findByPk(currentUserId);

    await targetUser.decrement('followersCount');
    await currentUser.decrement('followingCount');

    res.json({
      success: true,
      message: 'تم إلغاء متابعة المستخدم بنجاح'
    });
  } catch (error) {
    console.error('خطأ في إلغاء المتابعة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// البحث عن المستخدمين
router.get('/search', auth, async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'كلمة البحث يجب أن تكون حرفين على الأقل'
      });
    }

    const offset = (page - 1) * limit;

    const users = await User.findAndCountAll({
      where: {
        [require('sequelize').Op.or]: [
          { username: { [require('sequelize').Op.iLike]: `%${q}%` } },
          { firstName: { [require('sequelize').Op.iLike]: `%${q}%` } },
          { lastName: { [require('sequelize').Op.iLike]: `%${q}%` } }
        ],
        isActive: true
      },
      attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'isVerified'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['followersCount', 'DESC']]
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
    console.error('خطأ في البحث:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// اقتراح المستخدمين للمتابعة (بالذكاء الاصطناعي)
router.get('/suggestions', auth, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { limit = 10 } = req.query;

    // خوارزمية بسيطة لاقتراح المستخدمين
    // يمكن تطويرها لاحقاً بالذكاء الاصطناعي
    const Follow = require('../models/Follow');
    
    // العثور على المستخدمين الذين يتابعهم الأصدقاء
    const followingUsers = await Follow.findAll({
      where: { followerId: currentUserId },
      attributes: ['followingId']
    });

    const followingIds = followingUsers.map(f => f.followingId);
    followingIds.push(currentUserId); // استبعاد المستخدم الحالي

    const suggestions = await User.findAll({
      where: {
        id: { [require('sequelize').Op.notIn]: followingIds },
        isActive: true
      },
      attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'isVerified', 'followersCount'],
      limit: parseInt(limit),
      order: [['followersCount', 'DESC']]
    });

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('خطأ في اقتراح المستخدمين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

module.exports = router;