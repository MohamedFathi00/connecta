const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Follow = sequelize.define('Follow', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  followerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  followingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'blocked'),
    defaultValue: 'accepted',
    comment: 'حالة المتابعة (في حالة الحسابات الخاصة)'
  },
  notificationsEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'تفعيل الإشعارات لهذا المستخدم'
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['followerId', 'followingId']
    },
    {
      fields: ['followerId']
    },
    {
      fields: ['followingId']
    }
  ]
});

// العلاقات
Follow.belongsTo(require('./User'), { 
  foreignKey: 'followerId', 
  as: 'follower',
  onDelete: 'CASCADE'
});

Follow.belongsTo(require('./User'), { 
  foreignKey: 'followingId', 
  as: 'following',
  onDelete: 'CASCADE'
});

module.exports = Follow;