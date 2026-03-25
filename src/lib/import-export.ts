import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { db, type Transaction, initDefaultCategories } from './db'
import { loadAIConfig } from './ai-config'
import { aiBatchService, type BillItem, type BatchAnalysisResult } from './ai-batch-service'

interface ParsedRecord {
  date: Date
  amount: number
  type: 'income' | 'expense'
  categoryName: string
  note: string
  merchantName: string
  paymentMethod: string
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

function isXLSXFile(filename: string): boolean {
  const ext = getFileExtension(filename)
  return ext === 'xlsx' || ext === 'xls'
}

function parseDate(dateValue: any): Date {
  if (!dateValue) return new Date()
  console.log('原始日期值:', dateValue)
  
  // 尝试将字符串转换为数字，处理Excel序列号
  let numericDateValue = typeof dateValue === 'string' ? parseFloat(dateValue) : dateValue
  
  // 判断是否为Excel日期数字（一般 1 ~ 2958465 之间）
  function isExcelDate(num: number): boolean {
    return typeof num === 'number' && num > 0 && num < 2958466
  }
  
  // 如果是Excel日期数字，使用XLSX.SSF.parse_date_code处理
  if (isExcelDate(numericDateValue)) {
    try {
      const dateObj = XLSX.SSF.parse_date_code(numericDateValue)
      return new Date(dateObj.y, dateObj.m - 1, dateObj.d, dateObj.H || 0, dateObj.M || 0, dateObj.S || 0)
    } catch (error) {
      console.error('Excel日期转换失败:', error)
    }
  }
  
  // 转换为字符串处理
  let dateStr = String(dateValue).trim()
  console.log('原始日期字符串:', dateStr)
  
  // 移除所有不可见字符
  dateStr = dateStr.replace(/[\u0000-\u001F\u007F]/g, '')
  
  // 处理中文日期格式，如"2024年01月01日 12:00:00"
  dateStr = dateStr.replace(/年|月/g, '-').replace(/日/g, '').replace(/\s+/g, ' ')
  
  // 处理不同的日期分隔符
  dateStr = dateStr.replace(/\//g, '-')
  
  // 处理月/日/年格式（只有当第一个数字小于等于12时才认为是月/日/年格式）
  const mdYPattern = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/;
  if (mdYPattern.test(dateStr)) {
    const match = dateStr.match(mdYPattern);
    console.log('匹配结果:', match)
    if (match) {
      const firstPart = parseInt(match[1]);
      const secondPart = parseInt(match[2]);
      // 只有当第一个数字小于等于12且第二个数字小于等于31时，才认为是月/日/年格式
      // 否则认为是年/月/日格式
      if (firstPart <= 12 && secondPart <= 31) {
        dateStr = `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')} ${dateStr.split(' ')[1] || ''}`;
      }
    }
  }
  
  // 尝试直接解析日期
  let date = new Date(dateStr)
  console.log('直接解析日期:', dateStr)
  
  // 如果解析失败，尝试其他格式
  if (isNaN(date.getTime())) {
    // 尝试ISO格式
    const isoPattern = /^(\d{4})(\d{2})(\d{2})/;
    if (isoPattern.test(dateStr)) {
      const match = dateStr.match(isoPattern);
      if (match) {
        const isoDate = `${match[1]}-${match[2]}-${match[3]}`;
        date = new Date(isoDate);
      }
    }
    
    // 尝试移除时间部分后解析
    if (isNaN(date.getTime())) {
      const dateOnly = dateStr.split(' ')[0];
      date = new Date(dateOnly);
    }
  }
  
  // 如果仍然解析失败，返回当前日期
  if (isNaN(date.getTime())) {
    console.error('无法解析日期:', dateValue, '处理后:', dateStr);
    return new Date();
  }
  
  return date
}

function parseWechatCSV(text: string): ParsedRecord[] {
  const records: ParsedRecord[] = []
  const lines = text.split('\n')

  let headerIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('交易时间') && (lines[i].includes('交易类型') || lines[i].includes('收/支'))) {
      headerIndex = i
      break
    }
  }
  if (headerIndex === -1) return records

  const csvContent = lines.slice(headerIndex).join('\n')
  const result = Papa.parse(csvContent, { header: true, skipEmptyLines: true })

  for (const row of result.data as Record<string, string>[]) {
    const dateStr = row['交易时间']?.trim()
    const type = row['收/支']?.trim() || row['交易类型']?.trim()
    const amountStr = row['金额(元)']?.trim()?.replace('¥', '') || row['金额']?.trim()?.replace('¥', '')
    const commodity = row['商品']?.trim() || ''
    const counterpart = row['交易对方']?.trim() || ''
    const txType = row['交易类型']?.trim() || ''

    if (!dateStr || !amountStr) continue

    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount === 0) continue

    let isIncome = type === '收入' || type === '收款'
    // 处理金额为负数的情况
    if (amount < 0) {
      isIncome = false
    }
    const note = commodity || counterpart || txType

    let categoryName = '其他'
    if (isIncome) {
      if (note.includes('工资') || note.includes('薪')) categoryName = '工资'
      else if (note.includes('红包')) categoryName = '红包'
      else if (note.includes('奖')) categoryName = '奖金'
      else categoryName = '其他'
    } else {
      if (note.includes('餐') || note.includes('饭') || note.includes('食') || note.includes('外卖') || note.includes('美团') || note.includes('饿了么')) categoryName = '餐饮'
      else if (note.includes('打车') || note.includes('滴滴') || note.includes('地铁') || note.includes('公交') || note.includes('出行') || note.includes('加油')) categoryName = '交通'
      else if (note.includes('淘宝') || note.includes('京东') || note.includes('拼多多') || note.includes('购物')) categoryName = '购物'
      else if (note.includes('电话') || note.includes('话费') || note.includes('流量')) categoryName = '通讯'
      else if (note.includes('医') || note.includes('药') || note.includes('诊')) categoryName = '医疗'
      else categoryName = '其他'
    }

    records.push({
      date: parseDate(dateStr),
      amount: Math.abs(amount),
      type: isIncome ? 'income' : 'expense',
      categoryName,
      note,
      merchantName: counterpart,
      paymentMethod: '微信支付'
    })
  }

  return records
}

function parseWechatXLSX(data: any[]): ParsedRecord[] {
  console.log('原始数据:', data)
  const records: ParsedRecord[] = []
  
  // 查找表头行
  let headerRowIndex = -1
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if (Array.isArray(row) && row.some((cell: any) => cell && (cell.toString().includes('交易时间') || cell.toString().includes('交易类型') || cell.toString().includes('收/支')))) {
      headerRowIndex = i
      break
    }
  }
  
  if (headerRowIndex === -1) return records
  
  const row = data[headerRowIndex]
  if (!Array.isArray(row)) return records
  
  const headers = row.map((cell: any) => cell?.toString().trim() || '')
  
  // 查找各字段的索引
  const dateIndex = headers.findIndex((h: string) => h.includes('交易时间'))
  const typeIndex = headers.findIndex((h: string) => h.includes('收/支') || h.includes('交易类型'))
  const amountIndex = headers.findIndex((h: string) => h.includes('金额'))
  const commodityIndex = headers.findIndex((h: string) => h.includes('商品'))
  const counterpartIndex = headers.findIndex((h: string) => h.includes('交易对方'))
  const txTypeIndex = headers.findIndex((h: string) => h.includes('交易类型'))
  
  // 遍历数据行
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i]
    if (!Array.isArray(row) || row.length === 0) continue
    
    const dateStr = row[dateIndex]?.toString().trim()
    const type = row[typeIndex]?.toString().trim()
    let amountStr = row[amountIndex]?.toString().trim()
    const commodity = row[commodityIndex]?.toString().trim() || ''
    const counterpart = row[counterpartIndex]?.toString().trim() || ''
    const txType = row[txTypeIndex]?.toString().trim() || ''
    
    if (!dateStr || !amountStr) continue
    
    // 处理金额格式
    amountStr = amountStr.replace(/[¥,]/g, '')
    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount === 0) continue
    
    let isIncome = type === '收入' || type === '收款'
    // 处理金额为负数的情况
    if (amount < 0) {
      isIncome = false
    }
    const note = commodity || counterpart || txType
    
    let categoryName = '其他'
    if (isIncome) {
      if (note.includes('工资') || note.includes('薪')) categoryName = '工资'
      else if (note.includes('红包')) categoryName = '红包'
      else if (note.includes('奖')) categoryName = '奖金'
      else categoryName = '其他'
    } else {
      if (note.includes('餐') || note.includes('饭') || note.includes('食') || note.includes('外卖') || note.includes('美团') || note.includes('饿了么')) categoryName = '餐饮'
      else if (note.includes('打车') || note.includes('滴滴') || note.includes('地铁') || note.includes('公交') || note.includes('出行') || note.includes('加油')) categoryName = '交通'
      else if (note.includes('淘宝') || note.includes('京东') || note.includes('拼多多') || note.includes('购物')) categoryName = '购物'
      else if (note.includes('电话') || note.includes('话费') || note.includes('流量')) categoryName = '通讯'
      else if (note.includes('医') || note.includes('药') || note.includes('诊')) categoryName = '医疗'
      else categoryName = '其他'
    }
    
    records.push({
      date: parseDate(dateStr),
      amount: Math.abs(amount),
      type: isIncome ? 'income' : 'expense',
      categoryName,
      note,
      merchantName: counterpart,
      paymentMethod: '微信支付'
    })
  }
  
  return records
}

function parseAlipayCSV(text: string): ParsedRecord[] {
  const records: ParsedRecord[] = []
  const lines = text.split('\n')

  let headerIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('交易时间') || lines[i].includes('交易号') || lines[i].includes('交易订单号')) {
      headerIndex = i
      break
    }
  }
  if (headerIndex === -1) return records

  const csvContent = lines.slice(headerIndex).join('\n')
  const result = Papa.parse(csvContent, { header: true, skipEmptyLines: true })

  for (const row of result.data as Record<string, string>[]) {
    const dateStr = (row['交易时间'] || row['交易创建时间'] || row['创建时间'])?.trim()
    const type = (row['收/支'] || row['资金状态'] || row['交易状态'])?.trim()
    const amountStr = (row['金额（元）'] || row['金额'] || row['金额(元)'])?.trim()
    const commodity = (row['商品名称'] || row['商品说明'] || row['商品'])?.trim() || ''
    const counterpart = (row['交易对方'] || row['对方'] || row['商户名称'])?.trim() || ''

    if (!dateStr || !amountStr) continue

    const amount = parseFloat(amountStr.replace(/[¥,]/g, ''))
    if (isNaN(amount) || amount === 0) continue

    let isIncome = type === '收入' || type === '已收入' || type === '收款'
    // 处理金额为负数的情况
    if (amount < 0) {
      isIncome = false
    }
    const note = commodity || counterpart

    let categoryName = '其他'
    if (isIncome) {
      if (note.includes('工资') || note.includes('薪')) categoryName = '工资'
      else if (note.includes('红包')) categoryName = '红包'
      else if (note.includes('奖')) categoryName = '奖金'
      else categoryName = '其他'
    } else {
      if (note.includes('餐') || note.includes('饭') || note.includes('食') || note.includes('外卖') || note.includes('美团') || note.includes('饿了么')) categoryName = '餐饮'
      else if (note.includes('打车') || note.includes('滴滴') || note.includes('地铁') || note.includes('公交') || note.includes('出行') || note.includes('加油')) categoryName = '交通'
      else if (note.includes('淘宝') || note.includes('京东') || note.includes('拼多多') || note.includes('天猫') || note.includes('购物')) categoryName = '购物'
      else if (note.includes('电话') || note.includes('话费') || note.includes('流量')) categoryName = '通讯'
      else if (note.includes('医') || note.includes('药') || note.includes('诊')) categoryName = '医疗'
      else categoryName = '其他'
    }

    records.push({
      date: parseDate(dateStr),
      amount: Math.abs(amount),
      type: isIncome ? 'income' : 'expense',
      categoryName,
      note,
      merchantName: counterpart,
      paymentMethod: '支付宝'
    })
  }

  return records
}

function parseAlipayXLSX(data: any[]): ParsedRecord[] {
  const records: ParsedRecord[] = []
  
  // 查找表头行
  let headerRowIndex = -1
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if (Array.isArray(row) && row.some((cell: any) => cell && (cell.toString().includes('交易时间') || cell.toString().includes('交易号') || cell.toString().includes('交易订单号')))) {
      headerRowIndex = i
      break
    }
  }
  
  if (headerRowIndex === -1) return records
  
  const row = data[headerRowIndex]
  if (!Array.isArray(row)) return records
  
  const headers = row.map((cell: any) => cell?.toString().trim() || '')
  
  // 查找各字段的索引
  const dateIndex = headers.findIndex((h: string) => h.includes('交易时间') || h.includes('创建时间'))
  const typeIndex = headers.findIndex((h: string) => h.includes('收/支') || h.includes('资金状态') || h.includes('交易状态'))
  const amountIndex = headers.findIndex((h: string) => h.includes('金额'))
  const commodityIndex = headers.findIndex((h: string) => h.includes('商品名称') || h.includes('商品说明') || h.includes('商品'))
  const counterpartIndex = headers.findIndex((h: string) => h.includes('交易对方') || h.includes('对方') || h.includes('商户名称'))
  
  // 遍历数据行
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i]
    if (!Array.isArray(row) || row.length === 0) continue
    
    const dateStr = row[dateIndex]?.toString().trim()
    const type = row[typeIndex]?.toString().trim()
    let amountStr = row[amountIndex]?.toString().trim()
    const commodity = row[commodityIndex]?.toString().trim() || ''
    const counterpart = row[counterpartIndex]?.toString().trim() || ''
    
    if (!dateStr || !amountStr) continue
    
    // 处理金额格式
    amountStr = amountStr.replace(/[¥,]/g, '')
    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount === 0) continue
    
    let isIncome = type === '收入' || type === '已收入' || type === '收款'
    // 处理金额为负数的情况
    if (amount < 0) {
      isIncome = false
    }
    const note = commodity || counterpart
    
    let categoryName = '其他'
    if (isIncome) {
      if (note.includes('工资') || note.includes('薪')) categoryName = '工资'
      else if (note.includes('红包')) categoryName = '红包'
      else if (note.includes('奖')) categoryName = '奖金'
      else categoryName = '其他'
    } else {
      if (note.includes('餐') || note.includes('饭') || note.includes('食') || note.includes('外卖') || note.includes('美团') || note.includes('饿了么')) categoryName = '餐饮'
      else if (note.includes('打车') || note.includes('滴滴') || note.includes('地铁') || note.includes('公交') || note.includes('出行') || note.includes('加油')) categoryName = '交通'
      else if (note.includes('淘宝') || note.includes('京东') || note.includes('拼多多') || note.includes('天猫') || note.includes('购物')) categoryName = '购物'
      else if (note.includes('电话') || note.includes('话费') || note.includes('流量')) categoryName = '通讯'
      else if (note.includes('医') || note.includes('药') || note.includes('诊')) categoryName = '医疗'
      else categoryName = '其他'
    }
    
    records.push({
      date: parseDate(dateStr),
      amount: Math.abs(amount),
      type: isIncome ? 'income' : 'expense',
      categoryName,
      note,
      merchantName: counterpart,
      paymentMethod: '支付宝'
    })
  }
  
  return records
}

// 导入进度回调类型
export interface ImportProgress {
  stage: 'parsing' | 'deduplicating' | 'ai-analyzing' | 'saving';
  message: string;
  current: number;
  total: number;
}

export type ImportProgressCallback = (progress: ImportProgress) => void;

export async function importBill(
  file: File, 
  source: 'wechat' | 'alipay' | 'csv',
  onProgress?: ImportProgressCallback
): Promise<number> {
  try {
    let records: ParsedRecord[]

    // 报告解析阶段开始
    onProgress?.({
      stage: 'parsing',
      message: '正在解析文件...',
      current: 0,
      total: 100
    })

    if (isXLSXFile(file.name)) {
      // 处理XLSX文件
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      
      if (source === 'wechat') {
        records = parseWechatXLSX(data)
      } else if (source === 'alipay') {
        records = parseAlipayXLSX(data)
      } else {
        // 对于通用CSV，我们仍然使用文本解析
        const text = await file.text()
        records = parseGenericCSV(text)
      }
    } else {
      // 处理CSV文件
      const text = await file.text()
      if (source === 'wechat') {
        records = parseWechatCSV(text)
      } else if (source === 'alipay') {
        records = parseAlipayCSV(text)
      } else {
        records = parseGenericCSV(text)
      }
    }

    // 报告解析完成
    onProgress?.({
      stage: 'parsing',
      message: `解析完成，共 ${records.length} 条记录`,
      current: 100,
      total: 100
    })

    if (records.length === 0) return 0

    // 报告去重阶段开始
    onProgress?.({
      stage: 'deduplicating',
      message: '正在去重...',
      current: 0,
      total: records.length
    })

    // 去重处理：基于金额、日期、商户名称和支付方式来判断是否为重复记录
    // 1. 首先对导入的记录进行内部去重
    const uniqueRecords = new Map<string, ParsedRecord>()
    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const key = `${record.date.getTime()}_${record.amount}_${record.merchantName}_${record.paymentMethod}`
      if (!uniqueRecords.has(key)) {
        uniqueRecords.set(key, record)
      }
      // 每处理100条报告一次进度
      if (i % 100 === 0) {
        onProgress?.({
          stage: 'deduplicating',
          message: '正在去重...',
          current: i,
          total: records.length
        })
      }
    }
    records = Array.from(uniqueRecords.values())
    console.log(`内部去重后记录数: ${records.length}`)

    // 2. 与数据库中已有记录进行去重
    const existingTransactions = await db.transactions.toArray()
    const existingKeys = new Set(
      existingTransactions.map(tx => 
        `${new Date(tx.date).getTime()}_${tx.amount}_${tx.merchantName || ''}_${tx.paymentMethod || ''}`
      )
    )
    
    const newRecords = records.filter(record => {
      const key = `${record.date.getTime()}_${record.amount}_${record.merchantName}_${record.paymentMethod}`
      return !existingKeys.has(key)
    })
    
    console.log(`与数据库去重后新记录数: ${newRecords.length}, 跳过重复记录: ${records.length - newRecords.length}`)
    
    // 报告去重完成
    onProgress?.({
      stage: 'deduplicating',
      message: `去重完成，跳过 ${records.length - newRecords.length} 条重复记录`,
      current: records.length,
      total: records.length
    })
    
    if (newRecords.length === 0) {
      console.log('所有记录都已存在，无需导入')
      return 0
    }
    
    // 使用去重后的记录继续处理
    records = newRecords

    const categories = await db.categories.toArray()
    if (categories.length === 0) {
      // 初始化默认分类
      await initDefaultCategories()
      const updatedCategories = await db.categories.toArray()
      if (updatedCategories.length === 0) {
        throw new Error('无法初始化默认分类')
      }
      categories.push(...updatedCategories)
    }

    const categoryMap = new Map(categories.map(c => [c.name + '_' + c.type, c.id!]))

    // 加载AI配置
    const aiConfig = loadAIConfig()
    const useAI = !!aiConfig.apiKey
    console.log('AI配置加载结果:', { aiConfig, useAI })

    let transactions: Omit<Transaction, 'id'>[] = []
    let aiAnalysisCount = 0

    // 确定来源方式
    let billSource: '微信账单' | '支付宝账单' | '软件记录' = '软件记录'
    if (source === 'wechat') {
      billSource = '微信账单'
    } else if (source === 'alipay') {
      billSource = '支付宝账单'
    }

    // 从备注中提取商户名称的函数
    function extractMerchantName(note: string): string {
      // 常见的商户名称模式
      const patterns = [
        // 微信支付模式: "商户名称 - 商品"
        /^(.*?)\s*-\s*/,
        // 支付宝模式: "商户名称"
        /^([^\s]+)/,
        // 其他常见模式
        /^(.*?)(?:\s*[:：]|\s*\(|\s*\[|\s*\|)/
      ];
      
      for (const pattern of patterns) {
        const match = note.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      
      // 如果没有匹配到，返回空字符串
      return '';
    }

    // 收集所有支付方式
    const paymentMethods = new Set<string>()
    records.forEach(r => paymentMethods.add(r.paymentMethod))
    
    // 永久存储新的支付方式
    const existingPaymentMethods = await db.paymentMethods.toArray()
    const existingNames = new Set(existingPaymentMethods.map(pm => pm.name))
    
    const newPaymentMethods = Array.from(paymentMethods).filter(name => !existingNames.has(name))
    if (newPaymentMethods.length > 0) {
      const nextOrder = Math.max(...existingPaymentMethods.map(pm => pm.order), 0) + 1
      await db.paymentMethods.bulkAdd(
        newPaymentMethods.map((name, index) => ({
          name,
          icon: 'credit-card',
          color: '#64748B',
          isDefault: 0,
          order: nextOrder + index
        }))
      )
    }

    if (useAI) {
      // 报告AI分析阶段开始
      onProgress?.({
        stage: 'ai-analyzing',
        message: 'AI分析中...',
        current: 0,
        total: records.length
      })

      // 构建批量分析的账单数据
      const billsToAnalyze: BillItem[] = records.map((r, index) => ({
        id: `bill_${index}`,
        description: r.note,
        amount: r.amount,
        originalCategory: r.categoryName
      }))

      console.log('准备批量分析，账单数量:', billsToAnalyze.length)
      
      // 配置批量分析服务
      // 批处理大小将从配置中自动加载
      
      try {
        const startTime = Date.now()
        const batchResults = await aiBatchService.batchAnalyzeBills(
          billsToAnalyze,
          (current, total) => {
            onProgress?.({
              stage: 'ai-analyzing',
              message: `AI分析中... (${current}/${total})`,
              current,
              total
            })
          }
        )
        const endTime = Date.now()
        console.log('批量分析完成，耗时:', (endTime - startTime) / 1000, '秒')
        
        // 报告AI分析完成
        onProgress?.({
          stage: 'ai-analyzing',
          message: 'AI分析完成',
          current: records.length,
          total: records.length
        })
        
        // 处理分析结果
        transactions = records.map((r, index) => {
          const billId = `bill_${index}`
          const analysisResult = batchResults[billId]
          
          let categoryName = r.categoryName
          let note = r.note
          
          if (analysisResult) {
            categoryName = analysisResult.category
            if (analysisResult.optimizedNote) {
              note = analysisResult.optimizedNote
            }
            
            aiAnalysisCount++
          }
          
          return {
            amount: r.amount,
            type: r.type,
            categoryId: categoryMap.get(categoryName + '_' + r.type) || categoryMap.get('其他_' + r.type) || 1,
            categoryName,
            note,
            date: r.date,
            createdAt: new Date(),
            source: billSource,
            merchantName: r.merchantName,
            paymentMethod: r.paymentMethod
          }
        })
      } catch (error) {
        console.error('批量分析失败，使用默认分类:', error)
        // 失败时使用默认分类
        transactions = records.map(r => ({
          amount: r.amount,
          type: r.type,
          categoryId: categoryMap.get(r.categoryName + '_' + r.type) || categoryMap.get('其他_' + r.type) || 1,
          categoryName: r.categoryName,
          note: r.note,
          date: r.date,
          createdAt: new Date(),
          source: billSource,
          merchantName: r.merchantName,
          paymentMethod: r.paymentMethod
        }))
      }
    } else {
      // 不使用AI时，直接使用默认分类
      transactions = records.map(r => ({
        amount: r.amount,
        type: r.type,
        categoryId: categoryMap.get(r.categoryName + '_' + r.type) || categoryMap.get('其他_' + r.type) || 1,
        categoryName: r.categoryName,
        note: r.note,
        date: r.date,
        createdAt: new Date(),
        source: billSource,
        merchantName: r.merchantName,
        paymentMethod: r.paymentMethod
      }))
    }

    // 报告保存阶段
    onProgress?.({
      stage: 'saving',
      message: '正在保存数据...',
      current: 0,
      total: transactions.length
    })

    console.log('AI分析完成，共分析了', aiAnalysisCount, '条记录，总记录数:', transactions.length)
    await db.transactions.bulkAdd(transactions)
    
    // 报告保存完成
    onProgress?.({
      stage: 'saving',
      message: '保存完成',
      current: transactions.length,
      total: transactions.length
    })
    
    return transactions.length
  } catch (error) {
    console.error('导入账单时出错:', error)
    throw error
  }
}

function parseGenericCSV(text: string): ParsedRecord[] {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true })
  const records: ParsedRecord[] = []

  for (const row of result.data as Record<string, string>[]) {
    const date = row['日期'] || row['date'] || row['Date']
    const amount = row['金额'] || row['amount'] || row['Amount']
    const type = row['类型'] || row['type'] || row['Type']
    const category = row['分类'] || row['category'] || row['Category']
    const note = row['备注'] || row['note'] || row['Note'] || ''
    const merchantName = row['商户名称'] || row['merchant'] || row['Merchant'] || row['交易对方'] || row['对方'] || ''
    const paymentMethod = row['支付方式'] || row['payment'] || row['Payment'] || '其他'

    if (!date || !amount) continue

    const parsedAmount = parseFloat(amount.replace(/[¥,]/g, ''))
    if (isNaN(parsedAmount)) continue

    const isIncome = type === '收入' || type === 'income' || parsedAmount > 0

    records.push({
      date: parseDate(date),
      amount: Math.abs(parsedAmount),
      type: isIncome ? 'income' : 'expense',
      categoryName: category || '其他',
      note,
      merchantName,
      paymentMethod
    })
  }

  return records
}

export async function exportToCSV(): Promise<string> {
  const transactions = await db.transactions.orderBy('date').reverse().toArray()
  const data = transactions.map(t => ({
    '日期': t.date instanceof Date ? t.date.toISOString().split('T')[0] : new Date(t.date).toISOString().split('T')[0],
    '类型': t.type === 'income' ? '收入' : '支出',
    '金额': t.amount.toFixed(2),
    '分类': t.categoryName,
    '备注': t.note,
    '来源': t.source,
  }))
  return Papa.unparse(data)
}

export async function exportToJSON(): Promise<string> {
  const transactions = await db.transactions.orderBy('date').reverse().toArray()
  return JSON.stringify(transactions, null, 2)
}

export async function importFromJSON(text: string): Promise<number> {
  const data = JSON.parse(text) as Transaction[]
  if (!Array.isArray(data)) return 0

  const transactions: Omit<Transaction, 'id'>[] = data.map(t => ({
    amount: t.amount,
    type: t.type,
    categoryId: t.categoryId,
    categoryName: t.categoryName,
    note: t.note,
    date: new Date(t.date),
    createdAt: new Date(t.createdAt),
    source: t.source || '软件记录',
    merchantName: t.merchantName || '',
    paymentMethod: t.paymentMethod || '其他'
  }))

  await db.transactions.bulkAdd(transactions)
  return transactions.length
}
