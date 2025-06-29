# 🤝 دليل المساهمة في منصة التواصل الاجتماعي

نرحب بمساهماتكم! هذا الدليل سيساعدكم على البدء.

## 📋 جدول المحتويات

- [قواعد المساهمة](#قواعد-المساهمة)
- [كيفية المساهمة](#كيفية-المساهمة)
- [إرشادات الكود](#إرشادات-الكود)
- [إرشادات الـ Commit](#إرشادات-الـ-commit)
- [Pull Request Process](#pull-request-process)
- [الإبلاغ عن الأخطاء](#الإبلاغ-عن-الأخطاء)
- [طلب الميزات](#طلب-الميزات)

## قواعد المساهمة

### ميثاق السلوك
بالمشاركة في هذا المشروع، أنت توافق على الالتزام بـ [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). نتوقع من جميع المساهمين:

- **الاحترام**: تعامل مع الجميع باحترام وكياسة
- **التعاون**: ساعد الآخرين وقدم ملاحظات بناءة
- **الشمولية**: نرحب بالمساهمين من جميع الخلفيات والمستويات
- **الصبر**: كن صبوراً مع المبتدئين وقدم المساعدة عند الحاجة

## كيفية المساهمة

### 1. إعداد البيئة المحلية

```bash
# Fork المشروع على GitHub أولاً

# استنساخ fork الخاص بك
git clone https://github.com/YOUR-USERNAME/social-media-platform.git
cd social-media-platform

# إضافة المستودع الأصلي كـ remote
git remote add upstream https://github.com/ORIGINAL-OWNER/social-media-platform.git

# تثبيت التبعيات
cd frontend && npm install
cd ../backend && npm install
```

### 2. إنشاء فرع جديد

```bash
# التأكد من أنك في الفرع الرئيسي
git checkout main

# سحب آخر التحديثات
git pull upstream main

# إنشاء فرع جديد للميزة/الإصلاح
git checkout -b feature/amazing-feature
# أو
git checkout -b fix/bug-description
```

### 3. تطوير ميزتك

- اتبع [إرشادات الكود](#إرشادات-الكود)
- أضف اختبارات للميزات الجديدة
- تأكد من أن جميع الاختبارات تمر
- حدث الوثائق إذا لزم الأمر

### 4. Commit تغييراتك

```bash
# إضافة الملفات المعدلة
git add .

# commit مع رسالة وصفية
git commit -m "feat: add user profile avatar upload"
```

### 5. Push وإنشاء Pull Request

```bash
# push للفرع الخاص بك
git push origin feature/amazing-feature

# اذهب إلى GitHub وأنشئ Pull Request
```

## إرشادات الكود

### JavaScript/React
- استخدم **ES6+** syntax
- استخدم **functional components** مع Hooks
- اتبع **eslint configuration** الموجودة
- استخدم **Prettier** لتنسيق الكود

```javascript
// ✅ جيد
const UserProfile = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  
  const handleSave = useCallback(async (data) => {
    try {
      await onUpdate(data)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }, [onUpdate])

  return (
    <div className="user-profile">
      {/* component content */}
    </div>
  )
}

// ❌ سيء
function UserProfile(props) {
  const [isEditing, setIsEditing] = useState(false)
  // missing error handling, no useCallback
}
```

### CSS/Tailwind
- استخدم **Tailwind CSS** classes
- اتبع **mobile-first** approach
- استخدم **CSS custom properties** للقيم المتكررة

```jsx
// ✅ جيد
<div className="flex flex-col space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
    Title
  </h2>
</div>

// ❌ سيء - inline styles
<div style={{ display: 'flex', padding: '16px' }}>
  <h2 style={{ fontSize: '20px' }}>Title</h2>
</div>
```

### Node.js/Express
- استخدم **async/await** بدلاً من callbacks
- اتبع **RESTful API** conventions
- أضف **error handling** مناسب
- استخدم **middleware** للوظائف المشتركة

```javascript
// ✅ جيد
const createPost = async (req, res) => {
  try {
    const { title, content } = req.body
    
    // Validation
    if (!title || !content) {
      return res.status(400).json({
        error: 'Title and content are required'
      })
    }
    
    const post = await Post.create({
      title,
      content,
      userId: req.user.id
    })
    
    res.status(201).json({ post })
  } catch (error) {
    console.error('Create post error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// ❌ سيء
const createPost = (req, res) => {
  // No error handling, no validation
  Post.create(req.body, (err, post) => {
    res.json(post)
  })
}
```

## إرشادات الـ Commit

استخدم [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### أنواع الـ Commits:
- `feat`: ميزة جديدة
- `fix`: إصلاح خطأ
- `docs`: تحديث الوثائق
- `style`: تغييرات التنسيق (لا تؤثر على المعنى)
- `refactor`: إعادة هيكلة الكود
- `test`: إضافة أو تعديل الاختبارات
- `chore`: مهام الصيانة

### أمثلة:
```bash
feat(auth): add two-factor authentication
fix(posts): resolve image upload error
docs(api): update authentication endpoints
style(components): format user card component
refactor(utils): simplify date formatting function
test(auth): add tests for login flow
chore(deps): update dependencies
```

## Pull Request Process

### قبل إنشاء PR:
1. **تأكد من المتطلبات**:
   - [ ] الكود يتبع إرشادات الأسلوب
   - [ ] جميع الاختبارات تمر
   - [ ] لا توجد تحذيرات lint
   - [ ] الوثائق محدثة

2. **تشغيل الاختبارات**:
```bash
# Frontend tests
cd frontend && npm test

# Backend tests  
cd backend && npm test

# Lint check
npm run lint

# Type check (if using TypeScript)
npm run type-check
```

### عند إنشاء PR:
1. استخدم **عنوان وصفي**
2. املأ **template الخاص بـ PR**
3. اربط **القضايا ذات الصلة**
4. أضف **لقطات شاشة** للتغييرات المرئية
5. اطلب **مراجعة** من المطورين المناسبين

### مراجعة PR:
- سيتم مراجعة جميع PRs من قبل maintainers
- قد نطلب تغييرات قبل الموافقة
- اختبارات CI/CD يجب أن تمر
- بعد الموافقة، سيتم دمج PR

## الإبلاغ عن الأخطاء

### قبل الإبلاغ:
1. **ابحث في القضايا الموجودة**
2. **تأكد من استخدام أحدث إصدار**
3. **جرب إعادة إنتاج الخطأ**

### عند الإبلاغ:
استخدم [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) وقدم:
- **وصف واضح** للمشكلة
- **خطوات إعادة الإنتاج**
- **السلوك المتوقع** vs **الفعلي**
- **معلومات البيئة** (OS, Browser, Version)
- **لقطات شاشة** أو **أكواد خطأ**

## طلب الميزات

### قبل الطلب:
1. **ابحث في القضايا الموجودة**
2. **فكر في الحاجة الفعلية** للميزة
3. **اعتبر التأثير** على المستخدمين الآخرين

### عند الطلب:
استخدم [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md) وقدم:
- **وصف المشكلة** التي تحلها الميزة
- **الحل المقترح** بالتفصيل
- **البدائل المفكر بها**
- **أمثلة من منصات أخرى**
- **الفوائد والأولوية**

## أنواع المساهمات المرحب بها

### 🐛 إصلاح الأخطاء
- تصحيح bugs موجودة
- تحسين معالجة الأخطاء
- إصلاح مشاكل الأداء

### ✨ ميزات جديدة
- إضافة وظائف جديدة
- تحسين الميزات الموجودة
- دمج خدمات خارجية

### 📖 الوثائق
- تحسين README
- إضافة tutorials
- شرح الـ API
- ترجمة المحتوى

### 🎨 التصميم
- تحسين UI/UX
- إضافة themes جديدة
- تحسين الاستجابة
- إضافة animations

### 🧪 الاختبارات
- كتابة unit tests
- إضافة integration tests
- تحسين test coverage
- إضافة E2E tests

### ⚡ الأداء
- تحسين سرعة التحميل
- تقليل bundle size
- تحسين database queries
- إضافة caching

## المكافآت والتقدير

### 🏆 نظام النقاط
- **Bug Fix**: 10-50 نقطة
- **Feature**: 50-200 نقطة  
- **Documentation**: 5-25 نقطة
- **Major Contribution**: 200+ نقطة

### 🎖️ الشارات
- **First Contribution**: أول مساهمة
- **Bug Hunter**: إصلاح 5+ أخطاء
- **Feature Master**: إضافة 3+ ميزات
- **Documentation Hero**: تحسين الوثائق بشكل كبير

### 🌟 Contributors Hall of Fame
أفضل المساهمين سيتم عرضهم في:
- README الرئيسي
- موقع المشروع
- Social media shoutouts

## الحصول على المساعدة

### 💬 القنوات المتاحة:
- **GitHub Issues**: للأسئلة التقنية
- **Discord**: [رابط الخادم](https://discord.gg/yourserver)
- **Email**: contributors@yourapp.com
- **Twitter**: [@YourApp](https://twitter.com/yourapp)

### 📚 مصادر مفيدة:
- [React Documentation](https://reactjs.org/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Git Handbook](https://guides.github.com/introduction/git-handbook/)
- [JavaScript Style Guide](https://github.com/airbnb/javascript)

---

## شكر خاص 💙

نشكر جميع المساهمين الذين ساعدوا في جعل هذا المشروع أفضل:

<!-- Contributors will be added automatically -->

---

**شكراً لاهتمامكم بالمساهمة في منصة التواصل الاجتماعي! 🚀**

معاً نبني مستقبل التواصل الرقمي! 🌟