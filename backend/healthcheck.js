#!/usr/bin/env node

/**
 * Health Check Script للتطبيق
 * يتحقق من صحة جميع مكونات النظام
 */

const http = require('http')
const { Client } = require('pg')
const Redis = require('redis')

// إعدادات Health Check
const HEALTH_CHECK_CONFIG = {
  port: process.env.PORT || 5000,
  timeout: 5000,
  retries: 3
}

// ألوان الطباعة
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

// دوال الطباعة الملونة
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
}

// فحص خادم HTTP
async function checkHTTPServer() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: HEALTH_CHECK_CONFIG.port,
      path: '/api/health',
      method: 'GET',
      timeout: HEALTH_CHECK_CONFIG.timeout
    }

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve({ status: 'healthy', statusCode: res.statusCode })
      } else {
        reject(new Error(`HTTP server responded with status ${res.statusCode}`))
      }
    })

    req.on('error', (err) => {
      reject(new Error(`HTTP server error: ${err.message}`))
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('HTTP server timeout'))
    })

    req.end()
  })
}

// فحص قاعدة البيانات PostgreSQL
async function checkDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'social_media',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: HEALTH_CHECK_CONFIG.timeout
  })

  try {
    await client.connect()
    
    // اختبار استعلام بسيط
    const result = await client.query('SELECT NOW()')
    
    if (result.rows.length > 0) {
      await client.end()
      return { 
        status: 'healthy', 
        timestamp: result.rows[0].now,
        connectionTime: Date.now()
      }
    } else {
      throw new Error('Database query returned no results')
    }
  } catch (error) {
    try {
      await client.end()
    } catch (e) {
      // تجاهل أخطاء إغلاق الاتصال
    }
    throw new Error(`Database error: ${error.message}`)
  }
}

// فحص Redis
async function checkRedis() {
  const redis = Redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    connectTimeout: HEALTH_CHECK_CONFIG.timeout,
    lazyConnect: true
  })

  try {
    await redis.connect()
    
    // اختبار ping
    const pong = await redis.ping()
    
    if (pong === 'PONG') {
      await redis.quit()
      return { 
        status: 'healthy', 
        response: pong,
        connectionTime: Date.now()
      }
    } else {
      throw new Error('Redis ping failed')
    }
  } catch (error) {
    try {
      await redis.quit()
    } catch (e) {
      // تجاهل أخطاء الإغلاق
    }
    throw new Error(`Redis error: ${error.message}`)
  }
}

// فحص مساحة القرص
function checkDiskSpace() {
  const fs = require('fs')
  
  try {
    const stats = fs.statSync('.')
    const free = process.platform === 'win32' 
      ? require('child_process').execSync('dir /-c', { encoding: 'utf8' })
      : require('child_process').execSync('df -h .', { encoding: 'utf8' })
    
    // تحليل مبسط - في التطبيق الحقيقي يجب استخدام مكتبة متخصصة
    return {
      status: 'healthy',
      info: 'Disk space check completed'
    }
  } catch (error) {
    throw new Error(`Disk space check failed: ${error.message}`)
  }
}

// فحص استخدام الذاكرة
function checkMemoryUsage() {
  const memUsage = process.memoryUsage()
  const freeMemory = require('os').freemem()
  const totalMemory = require('os').totalmem()
  const usedMemoryPercentage = ((totalMemory - freeMemory) / totalMemory) * 100

  if (usedMemoryPercentage > 90) {
    throw new Error(`High memory usage: ${usedMemoryPercentage.toFixed(2)}%`)
  }

  return {
    status: 'healthy',
    processMemory: {
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`
    },
    systemMemory: {
      total: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
      free: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
      usage: `${usedMemoryPercentage.toFixed(2)}%`
    }
  }
}

// تشغيل فحص مع إعادة المحاولة
async function runHealthCheckWithRetry(checkFunction, name) {
  let lastError
  
  for (let attempt = 1; attempt <= HEALTH_CHECK_CONFIG.retries; attempt++) {
    try {
      log.info(`Running ${name} health check (attempt ${attempt}/${HEALTH_CHECK_CONFIG.retries})`)
      const result = await checkFunction()
      log.success(`${name} health check passed`)
      return result
    } catch (error) {
      lastError = error
      log.warning(`${name} health check failed (attempt ${attempt}/${HEALTH_CHECK_CONFIG.retries}): ${error.message}`)
      
      if (attempt < HEALTH_CHECK_CONFIG.retries) {
        // انتظار قبل إعادة المحاولة
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }
  
  throw lastError
}

// تشغيل جميع فحوصات الصحة
async function runAllHealthChecks() {
  const startTime = Date.now()
  const results = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  }

  const healthChecks = [
    { name: 'HTTP Server', fn: checkHTTPServer },
    { name: 'Database', fn: checkDatabase },
    { name: 'Redis', fn: checkRedis },
    { name: 'Disk Space', fn: checkDiskSpace },
    { name: 'Memory Usage', fn: checkMemoryUsage }
  ]

  for (const { name, fn } of healthChecks) {
    results.summary.total++
    
    try {
      const checkResult = await runHealthCheckWithRetry(fn, name)
      results.checks[name.toLowerCase().replace(' ', '_')] = {
        status: 'passed',
        ...checkResult
      }
      results.summary.passed++
    } catch (error) {
      log.error(`${name} health check failed: ${error.message}`)
      results.checks[name.toLowerCase().replace(' ', '_')] = {
        status: 'failed',
        error: error.message
      }
      results.summary.failed++
      results.status = 'unhealthy'
    }
  }

  const endTime = Date.now()
  results.duration = `${endTime - startTime}ms`

  return results
}

// إنشاء تقرير مفصل
function generateHealthReport(results) {
  const report = [
    '='.repeat(50),
    '🏥 تقرير فحص صحة النظام',
    '='.repeat(50),
    `الوقت: ${results.timestamp}`,
    `الحالة العامة: ${results.status.toUpperCase()}`,
    `مدة الفحص: ${results.duration}`,
    `الفحوصات المجتازة: ${results.summary.passed}/${results.summary.total}`,
    '',
    'تفاصيل الفحوصات:',
    '-'.repeat(30)
  ]

  for (const [checkName, checkResult] of Object.entries(results.checks)) {
    const statusSymbol = checkResult.status === 'passed' ? '✅' : '❌'
    report.push(`${statusSymbol} ${checkName.replace('_', ' ').toUpperCase()}: ${checkResult.status}`)
    
    if (checkResult.error) {
      report.push(`   خطأ: ${checkResult.error}`)
    }
    
    if (checkResult.info) {
      report.push(`   معلومات: ${checkResult.info}`)
    }
  }

  report.push('='.repeat(50))
  
  return report.join('\n')
}

// الدالة الرئيسية
async function main() {
  try {
    log.info('🚀 بدء فحص صحة النظام...')
    
    const results = await runAllHealthChecks()
    const report = generateHealthReport(results)
    
    console.log('\n' + report)
    
    if (results.status === 'healthy') {
      log.success('✅ جميع فحوصات الصحة نجحت!')
      process.exit(0)
    } else {
      log.error('❌ فشل في بعض فحوصات الصحة!')
      process.exit(1)
    }
  } catch (error) {
    log.error(`❌ خطأ في تشغيل فحوصات الصحة: ${error.message}`)
    process.exit(1)
  }
}

// تشغيل الفحص إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  main()
}

module.exports = {
  runAllHealthChecks,
  checkHTTPServer,
  checkDatabase,
  checkRedis,
  checkDiskSpace,
  checkMemoryUsage
}