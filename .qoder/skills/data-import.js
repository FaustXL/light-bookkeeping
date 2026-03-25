// Data Import Skill - 数据导入技能配置
// 处理微信支付、支付宝等第三方账单的解析和导入
module.exports = {
  name: 'data-import',
  description: '解析和导入微信支付、支付宝及通用CSV/JSON格式的账单数据',

  supportedFormats: {
    wechat: {
      description: '微信支付账单CSV',
      fileType: '.csv',
      encoding: 'UTF-8',
      headerMarker: '交易时间,交易类型',
      fields: ['交易时间', '交易类型', '收/支', '金额(元)', '商品', '交易对方'],
    },
    alipay: {
      description: '支付宝账单CSV',
      fileType: '.csv',
      encoding: 'UTF-8 / GBK',
      headerMarker: '交易时间,交易号',
      fields: ['交易时间', '收/支', '金额（元）', '商品名称', '交易对方'],
    },
    csv: {
      description: '通用CSV格式',
      fileType: '.csv',
      requiredColumns: ['日期/date', '金额/amount', '类型/type', '分类/category'],
      optionalColumns: ['备注/note'],
    },
    json: {
      description: 'JSON备份格式',
      fileType: '.json',
      schema: 'Transaction[]',
    },
  },

  categoryMapping: {
    expense: {
      '餐饮': ['餐', '饭', '食', '外卖', '美团', '饿了么'],
      '交通': ['打车', '滴滴', '地铁', '公交', '出行', '加油'],
      '购物': ['淘宝', '京东', '拼多多', '天猫', '购物'],
      '通讯': ['电话', '话费', '流量'],
      '医疗': ['医', '药', '诊'],
    },
    income: {
      '工资': ['工资', '薪'],
      '红包': ['红包'],
      '奖金': ['奖'],
    },
  },

  usage: `
    import { importBill, exportToCSV, exportToJSON, importFromJSON } from '@/lib/import-export'
    
    // 导入微信账单
    const count = await importBill(file, 'wechat')
    
    // 导入支付宝账单
    const count = await importBill(file, 'alipay')
    
    // 导入通用CSV
    const count = await importBill(file, 'csv')
    
    // 导入JSON备份
    const count = await importFromJSON(jsonText)
    
    // 导出CSV
    const csvContent = await exportToCSV()
    
    // 导出JSON
    const jsonContent = await exportToJSON()
  `,
};
