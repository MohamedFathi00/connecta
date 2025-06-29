const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminLog = sequelize.define('AdminLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'المدير الذي قام بالإجراء'
  },
  action: {
    type: DataTypes.ENUM(
      'verify_user',
      'unverify_user',
      'ban_user',
      'unban_user',
      'delete_post',
      'restore_post',
      'review_report',
      'create_admin',
      'delete_admin',
      'system_settings',
      'bulk_action'
    ),
    allowNull: false
  },
  targetUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'المستخدم المتأثر بالإجراء'
  },
  targetPostId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Posts',
      key: 'id'
    },
    comment: 'المنشور المتأثر بالإجراء'
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'تفاصيل إضافية عن الإجراء'
  },
  ipAddress: {
    type: DataTypes.INET,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

// العلاقات
AdminLog.belongsTo(require('./User'), { 
  foreignKey: 'adminId', 
  as: 'admin',
  onDelete: 'CASCADE'
});

AdminLog.belongsTo(require('./User'), { 
  foreignKey: 'targetUserId', 
  as: 'targetUser',
  onDelete: 'CASCADE'
});

AdminLog.belongsTo(require('./Post'), { 
  foreignKey: 'targetPostId', 
  as: 'targetPost',
  onDelete: 'CASCADE'
});

module.exports = AdminLog;