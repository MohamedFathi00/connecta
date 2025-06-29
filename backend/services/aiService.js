const axios = require('axios');

// خدمة تحليل المحتوى بالذكاء الاصطناعي
class AIService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;
  }

  // تحليل جودة المحتوى وإعطاء نقاط
  async analyzeContent(content) {
    try {
      if (!content || content.trim().length === 0) {
        return 0;
      }

      // خوارزمية بسيطة لتحليل المحتوى
      let score = 0;

      // طول المحتوى (كلمات أكثر = نقاط أعلى)
      const words = content.split(' ').length;
      score += Math.min(words * 0.5, 10);

      // وجود روابط أو هاشتاغات
      const hashtags = (content.match(/#\w+/g) || []).length;
      const links = (content.match(/https?:\/\/[^\s]+/g) || []).length;
      score += hashtags * 0.5 + links * 1;

      // تحليل المشاعر الأساسي
      const positiveWords = ['رائع', 'جميل', 'ممتاز', 'مذهل', 'أحب', 'سعيد', 'فخور'];
      const negativeWords = ['سيء', 'مزعج', 'أكره', 'غاضب', 'حزين', 'محبط'];
      
      const contentLower = content.toLowerCase();
      const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length;
      const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length;
      
      score += positiveCount * 1 - negativeCount * 0.5;

      // تحليل متقدم باستخدام OpenAI (اختياري)
      if (this.openaiApiKey && content.length > 100) {
        try {
          const aiScore = await this.getOpenAIContentScore(content);
          score = (score + aiScore) / 2;
        } catch (error) {
          console.error('خطأ في تحليل OpenAI:', error);
        }
      }

      return Math.max(0, Math.min(10, score));
    } catch (error) {
      console.error('خطأ في تحليل المحتوى:', error);
      return 0;
    }
  }

  // تحليل متقدم باستخدام OpenAI
  async getOpenAIContentScore(content) {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'system',
          content: 'أنت مُحلل محتوى ذكي. قيّم جودة المحتوى من 0 إلى 10 بناءً على: الوضوح، الفائدة، الأصالة، والتفاعل المتوقع. أرجع رقماً فقط.'
        }, {
          role: 'user',
          content: content
        }],
        max_tokens: 10,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const score = parseFloat(response.data.choices[0].message.content.trim());
      return isNaN(score) ? 5 : Math.max(0, Math.min(10, score));
    } catch (error) {
      throw error;
    }
  }

  // استخراج الكلمات المفتاحية
  async generateAITags(content) {
    try {
      if (!content || content.trim().length === 0) {
        return [];
      }

      const arabicStopWords = ['في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي', 'كان', 'كانت'];
      
      // استخراج الكلمات
      const words = content
        .replace(/[^\u0600-\u06FF\u0750-\u077F\s]/g, ' ') // الأحرف العربية فقط
        .split(/\s+/)
        .filter(word => word.length > 2 && !arabicStopWords.includes(word))
        .map(word => word.trim());

      // حساب تكرار الكلمات
      const wordCount = {};
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });

      // ترتيب الكلمات حسب التكرار
      const sortedWords = Object.entries(wordCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);

      // استخراج الهاشتاغات
      const hashtags = (content.match(/#[\u0600-\u06FF\u0750-\u077F]+/g) || [])
        .map(tag => tag.substring(1));

      return [...new Set([...sortedWords, ...hashtags])].slice(0, 5);
    } catch (error) {
      console.error('خطأ في استخراج الكلمات المفتاحية:', error);
      return [];
    }
  }

  // تحليل المشاعر
  async analyzeSentiment(content) {
    try {
      if (!content || content.trim().length === 0) {
        return { sentiment: 'neutral', confidence: 0 };
      }

      // تحليل أساسي للمشاعر
      const positiveWords = [
        'سعيد', 'رائع', 'جميل', 'ممتاز', 'مذهل', 'أحب', 'فرح', 'متحمس',
        'رضا', 'إعجاب', 'فخور', 'مبهور', 'مدهش', 'لذيذ', 'مريح'
      ];
      
      const negativeWords = [
        'حزين', 'سيء', 'مزعج', 'أكره', 'غاضب', 'محبط', 'متضايق', 'منزعج',
        'قلق', 'خائف', 'مؤلم', 'صعب', 'فظيع', 'مروع', 'محرج'
      ];

      const neutralWords = [
        'عادي', 'طبيعي', 'مقبول', 'معقول', 'متوسط', 'لا بأس'
      ];

      const contentLower = content.toLowerCase();
      
      const positiveCount = positiveWords.filter(word => contentLower.includes(word)).length;
      const negativeCount = negativeWords.filter(word => contentLower.includes(word)).length;
      const neutralCount = neutralWords.filter(word => contentLower.includes(word)).length;

      const totalEmotionalWords = positiveCount + negativeCount + neutralCount;
      
      let sentiment = 'neutral';
      let confidence = 0;

      if (positiveCount > negativeCount && positiveCount > neutralCount) {
        sentiment = 'positive';
        confidence = positiveCount / Math.max(totalEmotionalWords, 1);
      } else if (negativeCount > positiveCount && negativeCount > neutralCount) {
        sentiment = 'negative';
        confidence = negativeCount / Math.max(totalEmotionalWords, 1);
      } else {
        sentiment = 'neutral';
        confidence = neutralCount / Math.max(totalEmotionalWords, 1);
      }

      // استخدام HuggingFace للتحليل المتقدم (اختياري)
      if (this.huggingfaceApiKey && content.length > 50) {
        try {
          const advancedSentiment = await this.getHuggingFaceSentiment(content);
          // دمج النتائج
          confidence = (confidence + advancedSentiment.confidence) / 2;
          if (advancedSentiment.confidence > confidence) {
            sentiment = advancedSentiment.sentiment;
          }
        } catch (error) {
          console.error('خطأ في تحليل HuggingFace:', error);
        }
      }

      return {
        sentiment,
        confidence: Math.round(confidence * 100) / 100,
        details: {
          positiveWords: positiveCount,
          negativeWords: negativeCount,
          neutralWords: neutralCount
        }
      };
    } catch (error) {
      console.error('خطأ في تحليل المشاعر:', error);
      return { sentiment: 'neutral', confidence: 0 };
    }
  }

  // تحليل المشاعر باستخدام HuggingFace
  async getHuggingFaceSentiment(content) {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/CAMeL-Lab/bert-base-arabic-camelbert-msa-sentiment',
        { inputs: content },
        {
          headers: {
            'Authorization': `Bearer ${this.huggingfaceApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data[0];
      const sentimentMap = {
        'POSITIVE': 'positive',
        'NEGATIVE': 'negative',
        'NEUTRAL': 'neutral'
      };

      return {
        sentiment: sentimentMap[result.label] || 'neutral',
        confidence: result.score || 0
      };
    } catch (error) {
      throw error;
    }
  }

  // فلترة المحتوى المؤذي
  async moderateContent(content) {
    try {
      if (!content || content.trim().length === 0) {
        return { safe: true, categories: [] };
      }

      // قوائم الكلمات المحظورة
      const inappropriateWords = [
        // يمكن إضافة كلمات محظورة هنا
        'كلمة_محظورة1', 'كلمة_محظورة2'
      ];

      const spamPatterns = [
        /(.)\1{4,}/g, // تكرار نفس الحرف أكثر من 4 مرات
        /^[A-Z\s!]{20,}$/g, // كلام بأحرف كبيرة فقط
        /https?:\/\/[^\s]+/g, // روابط متعددة
      ];

      const contentLower = content.toLowerCase();
      const flaggedCategories = [];

      // فحص الكلمات المحظورة
      const hasInappropriateWords = inappropriateWords.some(word => 
        contentLower.includes(word)
      );
      if (hasInappropriateWords) {
        flaggedCategories.push('inappropriate_language');
      }

      // فحص أنماط السبام
      const hasSpamPatterns = spamPatterns.some(pattern => 
        pattern.test(content)
      );
      if (hasSpamPatterns) {
        flaggedCategories.push('spam');
      }

      // فحص الروابط المشبوهة
      const links = content.match(/https?:\/\/[^\s]+/g) || [];
      if (links.length > 3) {
        flaggedCategories.push('excessive_links');
      }

      // استخدام OpenAI Moderation API (اختياري)
      if (this.openaiApiKey) {
        try {
          const openaiModeration = await this.getOpenAIModeration(content);
          if (!openaiModeration.safe) {
            flaggedCategories.push(...openaiModeration.categories);
          }
        } catch (error) {
          console.error('خطأ في فلترة OpenAI:', error);
        }
      }

      return {
        safe: flaggedCategories.length === 0,
        categories: flaggedCategories,
        confidence: flaggedCategories.length > 0 ? 0.8 : 0.2
      };
    } catch (error) {
      console.error('خطأ في فلترة المحتوى:', error);
      return { safe: true, categories: [] };
    }
  }

  // فلترة المحتوى باستخدام OpenAI
  async getOpenAIModeration(content) {
    try {
      const response = await axios.post('https://api.openai.com/v1/moderations', {
        input: content
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const result = response.data.results[0];
      const flaggedCategories = Object.keys(result.categories)
        .filter(category => result.categories[category]);

      return {
        safe: !result.flagged,
        categories: flaggedCategories
      };
    } catch (error) {
      throw error;
    }
  }

  // اقتراح المحتوى المخصص
  async getPersonalizedRecommendations(userId, userPreferences, recentPosts) {
    try {
      // خوارزمية بسيطة للتوصيات
      const recommendations = {
        suggestedTopics: [],
        recommendedUsers: [],
        trendingHashtags: []
      };

      // تحليل اهتمامات المستخدم من منشوراته الأخيرة
      const userInterests = [];
      for (const post of recentPosts) {
        if (post.aiTags) {
          userInterests.push(...post.aiTags);
        }
      }

      // حساب الموضوعات الشائعة
      const interestCount = {};
      userInterests.forEach(interest => {
        interestCount[interest] = (interestCount[interest] || 0) + 1;
      });

      recommendations.suggestedTopics = Object.entries(interestCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([topic]) => topic);

      return recommendations;
    } catch (error) {
      console.error('خطأ في اقتراح المحتوى:', error);
      return { suggestedTopics: [], recommendedUsers: [], trendingHashtags: [] };
    }
  }
}

const aiService = new AIService();

// تصدير الدوال
module.exports = {
  analyzeContent: (content) => aiService.analyzeContent(content),
  generateAITags: (content) => aiService.generateAITags(content),
  analyzeSentiment: (content) => aiService.analyzeSentiment(content),
  moderateContent: (content) => aiService.moderateContent(content),
  getPersonalizedRecommendations: (userId, userPreferences, recentPosts) => 
    aiService.getPersonalizedRecommendations(userId, userPreferences, recentPosts)
};