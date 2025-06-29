const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Report = sequelize.define('Report', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'المستخدم الذي قام بالإبلاغ'
  },
  reportedUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'المستخدم المُبلَّغ عنه'
  },
  postId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Posts',
      key: 'id'
    }
  },
  commentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Comments',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('user', 'post', 'comment'),
    allowNull: false
  },
  reason: {
    type: DataTypes.ENUM(
      'spam',
      'harassment',
      'hate_speech',
      'violence',
      'nudity',
      'misinformation',
      'copyright',
      'impersonation',
      'other'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
    defaultValue: 'pending'
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'المشرف الذي راجع البلاغ'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  action: {
    type: DataTypes.ENUM('none', 'warning', 'content_removed', 'user_suspended', 'user_banned'),
    allowNull: true
  },
  actionNote: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

// العلاقات
Report.belongsTo(require('./User'), { 
  foreignKey: 'userId', 
  as: 'reporter',
  onDelete: 'CASCADE'
});

Report.belongsTo(require('./User'), { 
  foreignKey: 'reportedUserId', 
  as: 'reportedUser',
  onDelete: 'CASCADE'
});

Report.belongsTo(require('./Post'), { 
  foreignKey: 'postId', 
  as: 'post',
  onDelete: 'CASCADE'
});

Report.belongsTo(require('./Comment'), { 
  foreignKey: 'commentId', 
  as: 'comment',
  onDelete: 'CASCADE'
});

Report.belongsTo(require('./User'), { 
  foreignKey: 'reviewedBy', 
  as: 'reviewer',
  onDelete: 'SET NULL'
});

module.exports = Report;