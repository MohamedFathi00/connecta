const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 2000]
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Posts',
      key: 'id'
    }
  },
  parentCommentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Comments',
      key: 'id'
    },
    comment: 'للردود على التعليقات'
  },
  media: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'وسائط مرفقة بالتعليق'
  },
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  repliesCount: {
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
  // تحليل الذكاء الاصطناعي
  aiScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  sentimentAnalysis: {
    type: DataTypes.JSON,
    allowNull: true
  },
  isReported: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reportCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

// العلاقات
Comment.belongsTo(require('./User'), { 
  foreignKey: 'userId', 
  as: 'author',
  onDelete: 'CASCADE'
});

Comment.belongsTo(require('./Post'), { 
  foreignKey: 'postId', 
  as: 'post',
  onDelete: 'CASCADE'
});

Comment.belongsTo(Comment, { 
  foreignKey: 'parentCommentId', 
  as: 'parentComment',
  onDelete: 'CASCADE'
});

Comment.hasMany(Comment, { 
  foreignKey: 'parentCommentId', 
  as: 'replies'
});

// دوال مخصصة
Comment.prototype.updateEngagement = async function(type, increment = true) {
  const field = `${type}Count`;
  if (this[field] !== undefined) {
    this[field] += increment ? 1 : -1;
    await this.save();
  }
};

module.exports = Comment;