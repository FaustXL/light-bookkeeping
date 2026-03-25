const fs = require('fs');
const path = require('path');

// 模拟改进后的 parseWechatCSV 函数
function parseWechatCSV(text) {
  const records = [];
  const lines = text.split('\n');

  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('交易时间') && (lines[i].includes('交易类型') || lines[i].includes('收/支'))) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex === -1) return records;

  const csvContent = lines.slice(headerIndex).join('\n');
  // 简单的CSV解析，实际项目中使用Papa.parse
  const rows = csvContent.split('\n');
  const headers = rows[0].split(',');
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].split(',');
    if (row.length < headers.length) continue;
    
    const rowData = {};
    headers.forEach((header, index) => {
      rowData[header.trim()] = row[index]?.trim();
    });
    
    const dateStr = rowData['交易时间']?.trim();
    const type = rowData['收/支']?.trim() || rowData['交易类型']?.trim();
    const amountStr = rowData['金额(元)']?.trim()?.replace('¥', '') || rowData['金额']?.trim()?.replace('¥', '');
    const commodity = rowData['商品']?.trim() || '';
    const counterpart = rowData['交易对方']?.trim() || '';
    const txType = rowData['交易类型']?.trim() || '';

    if (!dateStr || !amountStr) continue;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount === 0) continue;

    let isIncome = type === '收入' || type === '收款';
    // 处理金额为负数的情况
    if (amount < 0) {
      isIncome = false;
    }
    const note = commodity || counterpart || txType;

    let categoryName = '其他';
    if (isIncome) {
      if (note.includes('工资') || note.includes('薪')) categoryName = '工资';
      else if (note.includes('红包')) categoryName = '红包';
      else if (note.includes('奖')) categoryName = '奖金';
      else categoryName = '其他';
    } else {
      if (note.includes('餐') || note.includes('饭') || note.includes('食') || note.includes('外卖') || note.includes('美团') || note.includes('饿了么')) categoryName = '餐饮';
      else if (note.includes('打车') || note.includes('滴滴') || note.includes('地铁') || note.includes('公交') || note.includes('出行') || note.includes('加油')) categoryName = '交通';
      else if (note.includes('淘宝') || note.includes('京东') || note.includes('拼多多') || note.includes('购物')) categoryName = '购物';
      else if (note.includes('电话') || note.includes('话费') || note.includes('流量')) categoryName = '通讯';
      else if (note.includes('医') || note.includes('药') || note.includes('诊')) categoryName = '医疗';
      else categoryName = '其他';
    }

    records.push({
      date: new Date(dateStr),
      amount: Math.abs(amount),
      type: isIncome ? 'income' : 'expense',
      categoryName,
      note,
    });
  }

  return records;
}

// 模拟改进后的 parseAlipayCSV 函数
function parseAlipayCSV(text) {
  const records = [];
  const lines = text.split('\n');

  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('交易时间') || lines[i].includes('交易号') || lines[i].includes('交易订单号')) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex === -1) return records;

  const csvContent = lines.slice(headerIndex).join('\n');
  // 简单的CSV解析，实际项目中使用Papa.parse
  const rows = csvContent.split('\n');
  const headers = rows[0].split(',');
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].split(',');
    if (row.length < headers.length) continue;
    
    const rowData = {};
    headers.forEach((header, index) => {
      rowData[header.trim()] = row[index]?.trim();
    });
    
    const dateStr = (rowData['交易时间'] || rowData['交易创建时间'] || rowData['创建时间'])?.trim();
    const type = (rowData['收/支'] || rowData['资金状态'] || rowData['交易状态'])?.trim();
    const amountStr = (rowData['金额（元）'] || rowData['金额'] || rowData['金额(元)'])?.trim();
    const commodity = (rowData['商品名称'] || rowData['商品说明'] || rowData['商品'])?.trim() || '';
    const counterpart = (rowData['交易对方'] || rowData['对方'] || rowData['商户名称'])?.trim() || '';

    if (!dateStr || !amountStr) continue;

    const amount = parseFloat(amountStr.replace(/[¥,]/g, ''));
    if (isNaN(amount) || amount === 0) continue;

    let isIncome = type === '收入' || type === '已收入' || type === '收款';
    // 处理金额为负数的情况
    if (amount < 0) {
      isIncome = false;
    }
    const note = commodity || counterpart;

    let categoryName = '其他';
    if (isIncome) {
      if (note.includes('工资') || note.includes('薪')) categoryName = '工资';
      else if (note.includes('红包')) categoryName = '红包';
      else if (note.includes('奖')) categoryName = '奖金';
      else categoryName = '其他';
    } else {
      if (note.includes('餐') || note.includes('饭') || note.includes('食') || note.includes('外卖') || note.includes('美团') || note.includes('饿了么')) categoryName = '餐饮';
      else if (note.includes('打车') || note.includes('滴滴') || note.includes('地铁') || note.includes('公交') || note.includes('出行') || note.includes('加油')) categoryName = '交通';
      else if (note.includes('淘宝') || note.includes('京东') || note.includes('拼多多') || note.includes('天猫') || note.includes('购物')) categoryName = '购物';
      else if (note.includes('电话') || note.includes('话费') || note.includes('流量')) categoryName = '通讯';
      else if (note.includes('医') || note.includes('药') || note.includes('诊')) categoryName = '医疗';
      else categoryName = '其他';
    }

    records.push({
      date: new Date(dateStr),
      amount: Math.abs(amount),
      type: isIncome ? 'income' : 'expense',
      categoryName,
      note,
    });
  }

  return records;
}

// 测试微信账单解析（标准格式）
function testWechatStandard() {
  console.log('=== 测试微信账单解析（标准格式）===');
  const testContent = `
微信支付交易明细

导出时间：2024-01-01 00:00:00

交易时间,交易类型,交易对方,商品,金额(元),交易状态,交易单号,商户单号,备注
2024-01-01 12:00:00,转账,张三,转账,100.00,已完成,1234567890,9876543210,
2024-01-02 13:00:00,支付,美团外卖,美团外卖,50.00,已完成,1234567891,9876543211,
2024-01-03 14:00:00,收款,李四,转账,200.00,已完成,1234567892,9876543212,
`;
  
  const records = parseWechatCSV(testContent);
  console.log(`解析出 ${records.length} 条记录`);
  console.log('解析结果:', records);
  console.log('=====================\n');
}

// 测试微信账单解析（简化格式）
function testWechatSimple() {
  console.log('=== 测试微信账单解析（简化格式）===');
  const testContent = `
微信支付交易明细

交易时间,收/支,交易对方,金额,备注
2024-01-01 12:00:00,支出,张三,100.00,
2024-01-02 13:00:00,支出,美团外卖,50.00,
2024-01-03 14:00:00,收入,李四,200.00,
`;
  
  const records = parseWechatCSV(testContent);
  console.log(`解析出 ${records.length} 条记录`);
  console.log('解析结果:', records);
  console.log('=====================\n');
}

// 测试微信账单解析（负数金额）
function testWechatNegative() {
  console.log('=== 测试微信账单解析（负数金额）===');
  const testContent = `
微信支付交易明细

交易时间,交易类型,交易对方,商品,金额(元),交易状态
2024-01-01 12:00:00,转账,张三,转账,-100.00,已完成
2024-01-02 13:00:00,支付,美团外卖,美团外卖,-50.00,已完成
2024-01-03 14:00:00,收款,李四,转账,200.00,已完成
`;
  
  const records = parseWechatCSV(testContent);
  console.log(`解析出 ${records.length} 条记录`);
  console.log('解析结果:', records);
  console.log('=====================\n');
}

// 测试支付宝账单解析（标准格式）
function testAlipayStandard() {
  console.log('=== 测试支付宝账单解析（标准格式）===');
  const testContent = `
支付宝交易记录明细

导出时间：2024-01-01 00:00:00

交易时间,交易分类,交易对方,商品说明,金额（元）,收/支,交易状态,交易订单号,商户订单号,备注
2024-01-01 12:00:00,转账,张三,,100.00,支出,交易成功,1234567890,9876543210,
2024-01-02 13:00:00,餐饮,肯德基,肯德基快餐,30.00,支出,交易成功,1234567891,9876543211,
2024-01-03 14:00:00,转账,李四,,150.00,收入,交易成功,1234567892,9876543212,
`;
  
  const records = parseAlipayCSV(testContent);
  console.log(`解析出 ${records.length} 条记录`);
  console.log('解析结果:', records);
  console.log('=====================\n');
}

// 测试支付宝账单解析（简化格式）
function testAlipaySimple() {
  console.log('=== 测试支付宝账单解析（简化格式）===');
  const testContent = `
支付宝交易记录

交易时间,对方,金额,交易状态
2024-01-01 12:00:00,张三,100.00,支出
2024-01-02 13:00:00,肯德基,30.00,支出
2024-01-03 14:00:00,李四,150.00,收入
`;
  
  const records = parseAlipayCSV(testContent);
  console.log(`解析出 ${records.length} 条记录`);
  console.log('解析结果:', records);
  console.log('=====================\n');
}

// 测试支付宝账单解析（不同字段名）
function testAlipayDifferentFields() {
  console.log('=== 测试支付宝账单解析（不同字段名）===');
  const testContent = `
支付宝交易记录

交易创建时间,商户名称,商品,金额(元),资金状态
2024-01-01 12:00:00,张三,,100.00,支出
2024-01-02 13:00:00,肯德基,肯德基快餐,30.00,支出
2024-01-03 14:00:00,李四,,150.00,收入
`;
  
  const records = parseAlipayCSV(testContent);
  console.log(`解析出 ${records.length} 条记录`);
  console.log('解析结果:', records);
  console.log('=====================\n');
}

// 运行所有测试
testWechatStandard();
testWechatSimple();
testWechatNegative();
testAlipayStandard();
testAlipaySimple();
testAlipayDifferentFields();
