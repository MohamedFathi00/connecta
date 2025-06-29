const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Like = sequelize.define('Like', {
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
    }
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
    type: DataTypes.ENUM('like', 'love', 'laugh', 'angry', 'sad', 'wow'),
    defaultValue: 'like'
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['userId', 'postId'],
      where: {
        postId: { [require('sequelize').Op.ne]: null }
      }
    },
    {
      unique: true,
      fields: ['userId', 'commentId'],
      where: {
        commentId: { [require('sequelize').Op.ne]: null }
      }
    }
  ]
});

// العلاقات
Like.belongsTo(require('./User'), { 
  foreignKey: 'userId', 
  as: 'user',
  onDelete: 'CASCADE'
});

Like.belongsTo(require('./Post'), { 
  foreignKey: 'postId', 
  as: 'post',
  onDelete: 'CASCADE'
});

module.exports = Like;