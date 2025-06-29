const express = require('express');
const { auth } = require('../middleware/auth');
const { 
  analyzeContent, 
  generateAITags, 
  analyzeSentiment, 
  moderateContent,
  getPersonalizedRecommendations 
} = require('../services/aiService');
const User = require('../models/User');
const Post = require('../models/Post');
const router = express.Router();

// تحليل محتوى قبل النشر
router.post('/analyze-content', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'المحتوى مطلوب'
      });
    }

    const [score, tags, sentiment, moderation] = await Promise.all([
      analyzeContent(content),
      generateAITags(content),
      analyzeSentiment(content),
      moderateContent(content)
    ]);

    res.json({
      success: true,
      data: {
        qualityScore: score,
        suggestedTags: tags,
        sentimentAnalysis: sentiment,
        contentModeration: moderation,
        recommendations: {
          shouldPost: moderation.safe && score > 3,
          suggestions: []
        }
      }
    });
  } catch (error) {
    console.error('خطأ في تحليل المحتوى:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// اقتراحات المحتوى المخصص
router.get('/recommendations', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // جلب المنشورات الأخيرة للمستخدم
    const recentPosts = await Post.findAll({
      where: { userId },
      limit: 20,
      order: [['createdAt', 'DESC']],
      attributes: ['aiTags', 'content', 'type']
    });

    const recommendations = await getPersonalizedRecommendations(
      userId, 
      user.preferences, 
      recentPosts
    );

    // إضافة اقتراحات إضافية
    const trendingPosts = await Post.findAll({
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        visibility: 'public'
      },
      order: [
        [require('sequelize').literal('(likes_count * 2 + comments_count * 3 + shares_count * 4)'), 'DESC']
      ],
      limit: 10,
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'isVerified']
      }]
    });

    res.json({
      success: true,
      data: {
        ...recommendations,
        trendingPosts,
        personalizedInsights: {
          mostActiveTime: await getMostActiveTime(userId),
          engagementRate: await getEngagementRate(userId),
          topPerformingContent: await getTopPerformingContent(userId)
        }
      }
    });
  } catch (error) {
    console.error('خطأ في اقتراحات المحتوى:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// اقتراح المستخدمين للمتابعة (ذكي)
router.get('/suggested-users', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 10 } = req.query;

    // الحصول على اهتمامات المستخدم
    const userPosts = await Post.findAll({
      where: { userId },
      attributes: ['aiTags'],
      limit: 50
    });

    const userInterests = [];
    userPosts.forEach(post => {
      if (post.aiTags) {
        userInterests.push(...post.aiTags);
      }
    });

    // العثور على المستخدمين المتابَعين حالياً
    const Follow = require('../models/Follow');
    const following = await Follow.findAll({
      where: { followerId: userId },
      attributes: ['followingId']
    });
    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId);

    // البحث عن مستخدمين مشابهين
    const suggestedUsers = await User.findAll({
      where: {
        id: { [require('sequelize').Op.notIn]: followingIds },
        isActive: true
      },
      attributes: ['id', 'username', 'firstName', 'lastName', 'avatar', 'isVerified', 'followersCount'],
      include: [{
        model: Post,
        as: 'posts',
        attributes: ['aiTags'],
        limit: 10,
        required: false
      }],
      limit: parseInt(limit) * 2 // جلب أكثر للفلترة
    });

    // حساب درجة التشابه
    const scoredUsers = suggestedUsers.map(user => {
      let similarityScore = 0;
      
      if (user.posts) {
        const userPostTags = user.posts.flatMap(post => post.aiTags || []);
        const commonInterests = userInterests.filter(interest => 
          userPostTags.includes(interest)
        );
        similarityScore = commonInterests.length;
      }

      // إضافة نقاط للمستخدمين المتحققين
      if (user.isVerified) {
        similarityScore += 2;
      }

      // إضافة نقاط للمستخدمين الشائعين
      similarityScore += Math.log(user.followersCount + 1) * 0.1;

      return {
        ...user.toJSON(),
        similarityScore
      };
    });

    // ترتيب وفلترة النتائج
    const finalSuggestions = scoredUsers
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, parseInt(limit))
      .map(user => {
        const { posts, similarityScore, ...userData } = user;
        return userData;
      });

    res.json({
      success: true,
      data: finalSuggestions
    });
  } catch (error) {
    console.error('خطأ في اقتراح المستخدمين:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// تحليل الترندات
router.get('/trends', auth, async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    let timeFilter;
    switch (period) {
      case '1h':
        timeFilter = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '24h':
        timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    // جلب المنشورات الحديثة
    const recentPosts = await Post.findAll({
      where: {
        createdAt: { [require('sequelize').Op.gte]: timeFilter },
        visibility: 'public',
        isDeleted: false
      },
      attributes: ['aiTags', 'content', 'likesCount', 'commentsCount', 'sharesCount'],
      limit: 1000
    });

    // تحليل الهاشتاغات الشائعة
    const hashtagCounts = {};
    const tagCounts = {};

    recentPosts.forEach(post => {
      // استخراج الهاشتاغات
      const hashtags = (post.content.match(/#[\u0600-\u06FF\u0750-\u077F\w]+/g) || [])
        .map(tag => tag.toLowerCase());
      
      hashtags.forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });

      // تحليل الكلمات المفتاحية
      if (post.aiTags) {
        post.aiTags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    // ترتيب النتائج
    const trendingHashtags = Object.entries(hashtagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    const trendingTopics = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    // تحليل المنشورات الشائعة
    const trendingPosts = recentPosts
      .sort((a, b) => {
        const scoreA = a.likesCount * 1 + a.commentsCount * 2 + a.sharesCount * 3;
        const scoreB = b.likesCount * 1 + b.commentsCount * 2 + b.sharesCount * 3;
        return scoreB - scoreA;
      })
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        trendingHashtags,
        trendingTopics,
        trendingPosts: trendingPosts.length,
        period,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('خطأ في تحليل الترندات:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// تحليل الشخصية والاهتمامات
router.get('/personality-insights', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // جلب منشورات المستخدم
    const userPosts = await Post.findAll({
      where: { userId },
      attributes: ['content', 'aiTags', 'sentimentAnalysis', 'type', 'createdAt'],
      limit: 100,
      order: [['createdAt', 'DESC']]
    });

    if (userPosts.length === 0) {
      return res.json({
        success: true,
        data: {
          message: 'لا توجد بيانات كافية لتحليل الشخصية',
          insights: {}
        }
      });
    }

    // تحليل الاهتمامات
    const allTags = userPosts.flatMap(post => post.aiTags || []);
    const tagCounts = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    const topInterests = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([interest, count]) => ({ interest, count }));

    // تحليل المشاعر العام
    const sentiments = userPosts
      .map(post => post.sentimentAnalysis)
      .filter(sentiment => sentiment && sentiment.sentiment);

    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    sentiments.forEach(sentiment => {
      sentimentCounts[sentiment.sentiment]++;
    });

    const totalSentiments = sentiments.length;
    const sentimentDistribution = {
      positive: Math.round((sentimentCounts.positive / totalSentiments) * 100),
      negative: Math.round((sentimentCounts.negative / totalSentiments) * 100),
      neutral: Math.round((sentimentCounts.neutral / totalSentiments) * 100)
    };

    // تحليل أنماط النشر
    const postTypes = {};
    userPosts.forEach(post => {
      postTypes[post.type] = (postTypes[post.type] || 0) + 1;
    });

    // تحليل أوقات النشر
    const postHours = userPosts.map(post => new Date(post.createdAt).getHours());
    const hourCounts = {};
    postHours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostActiveHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0];

    res.json({
      success: true,
      data: {
        topInterests,
        sentimentDistribution,
        postTypes,
        mostActiveHour: mostActiveHour ? `${mostActiveHour[0]}:00` : 'غير محدد',
        totalPosts: userPosts.length,
        insights: {
          personalityType: determinPersonalityType(sentimentDistribution, topInterests),
          recommendations: generatePersonalityRecommendations(sentimentDistribution, topInterests)
        }
      }
    });
  } catch (error) {
    console.error('خطأ في تحليل الشخصية:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// دوال مساعدة
async function getMostActiveTime(userId) {
  // تحليل أوقات النشر للمستخدم
  const posts = await Post.findAll({
    where: { userId },
    attributes: ['createdAt'],
    limit: 100
  });

  const hours = posts.map(post => new Date(post.createdAt).getHours());
  const hourCounts = {};
  hours.forEach(hour => {
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const mostActive = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)[0];

  return mostActive ? `${mostActive[0]}:00` : 'غير محدد';
}

async function getEngagementRate(userId) {
  const posts = await Post.findAll({
    where: { userId },
    attributes: ['likesCount', 'commentsCount', 'sharesCount'],
    limit: 20
  });

  if (posts.length === 0) return 0;

  const totalEngagement = posts.reduce((sum, post) => 
    sum + post.likesCount + post.commentsCount + post.sharesCount, 0
  );

  return Math.round(totalEngagement / posts.length * 100) / 100;
}

async function getTopPerformingContent(userId) {
  const topPost = await Post.findOne({
    where: { userId },
    order: [
      [require('sequelize').literal('(likes_count + comments_count * 2 + shares_count * 3)'), 'DESC']
    ],
    attributes: ['content', 'likesCount', 'commentsCount', 'sharesCount', 'type']
  });

  return topPost ? {
    content: topPost.content?.substring(0, 100) + '...',
    type: topPost.type,
    engagement: topPost.likesCount + topPost.commentsCount + topPost.sharesCount
  } : null;
}

function determinPersonalityType(sentimentDistribution, interests) {
  const { positive, negative, neutral } = sentimentDistribution;
  
  if (positive > 60) {
    return 'متفائل ونشيط';
  } else if (negative > 40) {
    return 'ناقد ومحلل';
  } else if (neutral > 50) {
    return 'متوازن وموضوعي';
  } else {
    return 'متنوع المشاعر';
  }
}

function generatePersonalityRecommendations(sentimentDistribution, interests) {
  const recommendations = [];
  
  if (sentimentDistribution.positive > 50) {
    recommendations.push('شارك المزيد من المحتوى الإيجابي لتحفيز الآخرين');
  }
  
  if (interests.length > 5) {
    recommendations.push('لديك اهتمامات متنوعة، فكر في إنشاء سلاسل محتوى متخصصة');
  }
  
  recommendations.push('استخدم الهاشتاغات المتعلقة باهتماماتك لزيادة الوصول');
  
  return recommendations;
}

module.exports = router;