const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'لا يوجد توكن، الوصول غير مسموح'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'توكن غير صالح'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'الحساب غير نشط'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'الحساب محظور'
      });
    }

    req.user = decoded;
    req.userProfile = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'انتهت صلاحية التوكن'
      });
    }

    res.status(401).json({
      success: false,
      message: 'توكن غير صالح'
    });
  }
};

// middleware للتحقق من صلاحيات الإدارة
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});

    if (!req.userProfile || !['admin', 'super_admin'].includes(req.userProfile.role)) {
      return res.status(403).json({
        success: false,
        message: 'غير مخول للوصول لهذا المورد'
      });
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'خطأ في التحقق من الصلاحيات'
    });
  }
};

// middleware للتحقق من صلاحيات المشرف
const moderatorAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});

    if (!req.userProfile || !['moderator', 'admin', 'super_admin'].includes(req.userProfile.role)) {
      return res.status(403).json({
        success: false,
        message: 'غير مخول للوصول لهذا المورد'
      });
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'خطأ في التحقق من الصلاحيات'
    });
  }
};

module.exports = { auth, adminAuth, moderatorAuth };