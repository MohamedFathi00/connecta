const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { analyzeContent, generateAITags } = require('../services/aiService');
const router = express.Router();

// إنشاء منشور جديد
router.post('/', auth, [
  body('content').optional().isLength({ max: 5000 }).withMessage('المحتوى طويل جداً'),
  body('type').optional().isIn(['text', 'image', 'video', 'audio', 'live', 'ar_content']),
  body('visibility').optional().isIn(['public', 'friends', 'private', 'followers'])
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

    const { content, type = 'text', media, arData, location, visibility = 'public' } = req.body;

    if (!content && !media) {
      return res.status(400).json({
        success: false,
        message: 'المنشور يجب أن يحتوي على محتوى أو وسائط'
      });
    }

    // تحليل المحتوى بالذكاء الاصطناعي
    let aiScore = 0;
    let aiTags = [];
    let sentimentAnalysis = null;

    if (content) {
      try {
        aiScore = await analyzeContent(content);
        aiTags = await generateAITags(content);
        sentimentAnalysis = await analyzeSentiment(content);
      } catch (aiError) {
        console.error('خطأ في تحليل الذكاء الاصطناعي:', aiError);
      }
    }

    // إنشاء المنشور
    const post = await Post.create({
      userId: req.user.userId,
      content,
      type,
      media,
      arData,
      location,
      visibility,
      aiScore,
      aiTags,
      sentimentAnalysis
    });

    // تحديث عدد المنشورات للمستخدم
    await User.increment('postsCount', { where: { id: req.user.userId } });

    // جلب المنشور مع بيانات المؤلف
    const postWithAuthor = await Post.findByPk(post.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'isVerified']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المنشور بنجاح',
      data: postWithAuthor
    });
  } catch (error) {
    console.error('خطأ في إنشاء المنشور:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// جلب الخلاصة الرئيسية (Feed)
router.get('/feed', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.userId;

    // جلب المستخدمين المتابَعين
    const Follow = require('../models/Follow');
    const following = await Follow.findAll({
      where: { followerId: userId },
      attributes: ['followingId']
    });

    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId); // إضافة منشورات المستخدم نفسه

    // خوارزمية الخلاصة الذكية
    const posts = await Post.findAndCountAll({
      where: {
        userId: { [require('sequelize').Op.in]: followingIds },
        visibility: { [require('sequelize').Op.in]: ['public', 'friends', 'followers'] },
        isDeleted: false
      },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'isVerified']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [
        // خوارزمية ترتيب ذكية تعتمد على:
        // 1. نقاط الذكاء الاصطناعي
        // 2. التفاعل الحديث
        // 3. وقت النشر
        [require('sequelize').literal('(ai_score * 0.3 + (likes_count + comments_count * 2 + shares_count * 3) * 0.5 - EXTRACT(EPOCH FROM (NOW() - created_at))/3600 * 0.2)'), 'DESC']
      ]
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
    console.error('خطأ في جلب الخلاصة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// جلب منشور واحد
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'isVerified']
        },
        {
          model: Post,
          as: 'originalPost',
          include: [{
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'isVerified']
          }]
        }
      ]
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    // زيادة عدد المشاهدات
    await post.incrementViews();

    // التحقق من الخصوصية
    if (post.visibility === 'private' && post.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'غير مخول لرؤية هذا المنشور'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('خطأ في جلب المنشور:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// الإعجاب بمنشور
router.post('/:id/like', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.userId;

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    const Like = require('../models/Like');
    const existingLike = await Like.findOne({
      where: { postId, userId }
    });

    if (existingLike) {
      // إلغاء الإعجاب
      await existingLike.destroy();
      await post.updateEngagement('likes', false);

      res.json({
        success: true,
        message: 'تم إلغاء الإعجاب',
        liked: false
      });
    } else {
      // إضافة إعجاب
      await Like.create({ postId, userId });
      await post.updateEngagement('likes', true);

      // إشعار صاحب المنشور
      if (post.userId !== userId) {
        const Notification = require('../models/Notification');
        await Notification.create({
          userId: post.userId,
          fromUserId: userId,
          type: 'like',
          postId,
          message: 'أعجب بمنشورك'
        });
      }

      res.json({
        success: true,
        message: 'تم الإعجاب بالمنشور',
        liked: true
      });
    }
  } catch (error) {
    console.error('خطأ في الإعجاب:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// مشاركة منشور
router.post('/:id/share', auth, async (req, res) => {
  try {
    const originalPostId = req.params.id;
    const { content } = req.body;

    const originalPost = await Post.findByPk(originalPostId);
    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    if (!originalPost.allowShares) {
      return res.status(403).json({
        success: false,
        message: 'المشاركة غير مسموحة لهذا المنشور'
      });
    }

    // إنشاء منشور مشاركة
    const sharedPost = await Post.create({
      userId: req.user.userId,
      content,
      type: 'text',
      originalPostId,
      visibility: 'public'
    });

    // تحديث عدد المشاركات
    await originalPost.updateEngagement('shares', true);

    res.status(201).json({
      success: true,
      message: 'تم مشاركة المنشور بنجاح',
      data: sharedPost
    });
  } catch (error) {
    console.error('خطأ في المشاركة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// حذف منشور
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    // التأكد من أن المستخدم هو صاحب المنشور أو مشرف
    if (post.userId !== req.user.userId && !['admin', 'super_admin'].includes(req.userProfile.role)) {
      return res.status(403).json({
        success: false,
        message: 'غير مخول لحذف هذا المنشور'
      });
    }

    // الحذف الناعم
    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    // تقليل عدد المنشورات
    await User.decrement('postsCount', { where: { id: post.userId } });

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

// الإبلاغ عن منشور
router.post('/:id/report', auth, async (req, res) => {
  try {
    const { reason, description } = req.body;
    const postId = req.params.id;
    const userId = req.user.userId;

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'المنشور غير موجود'
      });
    }

    const Report = require('../models/Report');
    const existingReport = await Report.findOne({
      where: { postId, userId }
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'لقد أبلغت عن هذا المنشور من قبل'
      });
    }

    await Report.create({
      postId,
      userId,
      reason,
      description,
      type: 'post'
    });

    // زيادة عدد البلاغات
    await post.increment('reportCount');

    // إذا تجاوز عدد البلاغات حد معين، قم بإخفاء المنشور تلقائياً
    if (post.reportCount >= 10) {
      post.isReported = true;
      await post.save();
    }

    res.json({
      success: true,
      message: 'تم تسجيل البلاغ بنجاح'
    });
  } catch (error) {
    console.error('خطأ في الإبلاغ:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

module.exports = router;