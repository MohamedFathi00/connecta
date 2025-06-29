const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/email');
const router = express.Router();

// تسجيل مستخدم جديد
router.post('/register', [
  body('username').isLength({ min: 3, max: 50 }).withMessage('اسم المستخدم يجب أن يكون بين 3-50 حرف'),
  body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح'),
  body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  body('firstName').notEmpty().withMessage('الاسم الأول مطلوب'),
  body('lastName').notEmpty().withMessage('الاسم الأخير مطلوب')
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

    const { username, email, password, firstName, lastName, dateOfBirth } = req.body;

    // التحقق من وجود المستخدم
    const existingUser = await User.findOne({
      where: {
        $or: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'المستخدم موجود بالفعل'
      });
    }

    // إنشاء مستخدم جديد
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      dateOfBirth
    });

    // إنشاء JWT Token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // إرسال بريد التحقق
    await sendVerificationEmail(user.email, user.id);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('خطأ في التسجيل:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// تسجيل الدخول
router.post('/login', [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح'),
  body('password').notEmpty().withMessage('كلمة المرور مطلوبة')
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

    const { email, password, twoFactorCode } = req.body;

    // العثور على المستخدم
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    // التحقق من قفل الحساب
    if (user.isAccountLocked()) {
      return res.status(423).json({
        success: false,
        message: 'الحساب مقفل مؤقتاً، حاول مرة أخرى لاحقاً'
      });
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // زيادة عدد محاولات الدخول الخاطئة
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000; // قفل لمدة 30 دقيقة
      }
      await user.save();

      return res.status(401).json({
        success: false,
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    // التحقق من المصادقة الثنائية
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({
          success: true,
          requireTwoFactor: true,
          message: 'أدخل رمز التحقق الثنائي'
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({
          success: false,
          message: 'رمز التحقق الثنائي غير صحيح'
        });
      }
    }

    // تسجيل الدخول الناجح
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    // إنشاء JWT Token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// إعداد المصادقة الثنائية
router.post('/setup-2fa', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'المصادقة الثنائية مفعلة بالفعل'
      });
    }

    const secret = speakeasy.generateSecret({
      name: `Social Platform (${user.email})`,
      issuer: 'Social Platform'
    });

    // حفظ السر مؤقتاً
    user.twoFactorSecret = secret.base32;
    await user.save();

    // إنشاء QR Code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl
      }
    });
  } catch (error) {
    console.error('خطأ في إعداد المصادقة الثنائية:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// تفعيل المصادقة الثنائية
router.post('/verify-2fa', require('../middleware/auth'), async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findByPk(req.user.userId);

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'رمز التحقق غير صحيح'
      });
    }

    user.twoFactorEnabled = true;
    await user.save();

    res.json({
      success: true,
      message: 'تم تفعيل المصادقة الثنائية بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تفعيل المصادقة الثنائية:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// تسجيل الخروج
router.post('/logout', require('../middleware/auth'), async (req, res) => {
  try {
    // في حالة استخدام Redis لتخزين الجلسات
    // await redisClient.del(`user_session:${req.user.userId}`);

    res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// نسيان كلمة المرور
router.post('/forgot-password', [
  body('email').isEmail().withMessage('البريد الإلكتروني غير صحيح')
], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({
        success: true,
        message: 'إذا كان البريد الإلكتروني موجود، ستتلقى رسالة إعادة تعيين كلمة المرور'
      });
    }

    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await sendResetPasswordEmail(user.email, resetToken);

    res.json({
      success: true,
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
    });
  } catch (error) {
    console.error('خطأ في نسيان كلمة المرور:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// التحقق من صحة التوكن
router.get('/verify-token', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'توكن غير صالح'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('خطأ في التحقق من التوكن:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

module.exports = router;