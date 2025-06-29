const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'live', 'ar_content'),
    defaultValue: 'text'
  },
  media: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'معلومات الوسائط (صور، فيديوهات، صوتيات)'
  },
  arData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'بيانات الواقع المعزز'
  },
  location: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'الموقع الجغرافي'
  },
  visibility: {
    type: DataTypes.ENUM('public', 'friends', 'private', 'followers'),
    defaultValue: 'public'
  },
  isSponsored: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sponsorData: {
    type: DataTypes.JSON,
    allowNull: true
  },
  // إحصائيات التفاعل
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  commentsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sharesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  viewsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // خوارزمية الذكاء الاصطناعي
  aiScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'نقاط جودة المحتوى بالذكاء الاصطناعي'
  },
  aiTags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'الكلمات المفتاحية المستخرجة بالذكاء الاصطناعي'
  },
  sentimentAnalysis: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'تحليل المشاعر'
  },
  // الإعدادات
  allowComments: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  allowShares: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isReported: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reportCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // معرف المنشور الأصلي في حالة المشاركة
  originalPostId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Posts',
      key: 'id'
    }
  },
  // البث المباشر
  liveStreamData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'بيانات البث المباشر'
  },
  isLive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// علاقات النموذج
Post.belongsTo(require('./User'), { 
  foreignKey: 'userId', 
  as: 'author',
  onDelete: 'CASCADE'
});

Post.belongsTo(Post, { 
  foreignKey: 'originalPostId', 
  as: 'originalPost',
  onDelete: 'SET NULL'
});

// دوال مخصصة
Post.prototype.incrementViews = async function() {
  this.viewsCount += 1;
  await this.save();
};

Post.prototype.updateEngagement = async function(type, increment = true) {
  const field = `${type}Count`;
  if (this[field] !== undefined) {
    this[field] += increment ? 1 : -1;
    await this.save();
  }
};

module.exports = Post;