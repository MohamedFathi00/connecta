const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100]
    }
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  },
  coverImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'العلامة الزرقاء للحسابات المميزة'
  },
  verificationLevel: {
    type: DataTypes.ENUM('none', 'email', 'phone', 'government', 'celebrity', 'business'),
    defaultValue: 'none'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isBanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  banReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('user', 'moderator', 'admin', 'super_admin'),
    defaultValue: 'user'
  },
  privacySettings: {
    type: DataTypes.JSON,
    defaultValue: {
      profileVisibility: 'public', // public, friends, private
      showEmail: false,
      showPhone: false,
      allowMessages: 'everyone', // everyone, friends, none
      allowTagging: 'everyone',
      showOnlineStatus: true
    }
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      language: 'ar',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        likes: true,
        comments: true,
        follows: true,
        messages: true
      },
      aiRecommendations: true,
      arFilters: true
    }
  },
  twoFactorSecret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // إحصائيات
  followersCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  followingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  postsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // معلومات إضافية
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  phoneVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// دوال مخصصة
User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

User.prototype.isAccountLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.twoFactorSecret;
  return values;
};

module.exports = User;