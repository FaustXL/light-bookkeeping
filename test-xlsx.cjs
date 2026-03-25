const fs = require('fs');
const path = require('path');

// 模拟XLSX解析函数
function parseWechatXLSX(data) {
  const records = [];
  
  // 查找表头行
  let headerRowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (Array.isArray(row) && row.some((cell) => cell && (cell.toString().includes('交易时间') || cell.toString().includes('交易类型') || cell.toString().includes('收/支')))) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) return records;
  
  const row = data[headerRowIndex];
  if (!Array.isArray(row)) return records;
  
  const headers = row.map((cell) => cell?.toString().trim() || '');
  
  // 查找各字段的索引
  const dateIndex = headers.findIndex((h) => h.includes('交易时间'));
  const typeIndex = headers.findIndex((h) => h.includes('收/支') || h.includes('交易类型'));
  const amountIndex = headers.findIndex((h) => h.includes('金额'));
  const commodityIndex = headers.findIndex((h) => h.includes('商品'));
  const counterpartIndex = headers.findIndex((h) => h.includes('交易对方'));
  const txTypeIndex = headers.findIndex((h) => h.includes('交易类型'));
  
  // 遍历数据行
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row) || row.length === 0) continue;
    
    const dateStr = row[dateIndex]?.toString().trim();
    const type = row[typeIndex]?.toString().trim();
    let amountStr = row[amountIndex]?.toString().trim();
    const commodity = row[commodityIndex]?.toString().trim() || '';
    const counterpart = row[counterpartIndex]?.toString().trim() || '';
    const txType = row[txTypeIndex]?.toString().trim() || '';
    
    if (!dateStr || !amountStr) continue;
    
    // 处理金额格式
    amountStr = amountStr.replace(/[¥,]/g, '');
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

function parseAlipayXLSX(data) {
  const records = [];
  
  // 查找表头行
  let headerRowIndex = -1;
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (Array.isArray(row) && row.some((cell) => cell && (cell.toString().includes('交易时间') || cell.toString().includes('交易号') || cell.toString().includes('交易订单号')))) {
      headerRowIndex = i;
      break;
    }
  }
  
  if (headerRowIndex === -1) return records;
  
  const row = data[headerRowIndex];
  if (!Array.isArray(row)) return records;
  
  const headers = row.map((cell) => cell?.toString().trim() || '');
  
  // 查找各字段的索引
  const dateIndex = headers.findIndex((h) => h.includes('交易时间') || h.includes('创建时间'));
  const typeIndex = headers.findIndex((h) => h.includes('收/支') || h.includes('资金状态') || h.includes('交易状态'));
  const amountIndex = headers.findIndex((h) => h.includes('金额'));
  const commodityIndex = headers.findIndex((h) => h.includes('商品名称') || h.includes('商品说明') || h.includes('商品'));
  const counterpartIndex = headers.findIndex((h) => h.includes('交易对方') || h.includes('对方') || h.includes('商户名称'));
  
  // 遍历数据行
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row) || row.length === 0) continue;
    
    const dateStr = row[dateIndex]?.toString().trim();
    const type = row[typeIndex]?.toString().trim();
    let amountStr = row[amountIndex]?.toString().trim();
    const commodity = row[commodityIndex]?.toString().trim() || '';
    const counterpart = row[counterpartIndex]?.toString().trim() || '';
    
    if (!dateStr || !amountStr) continue;
    
    // 处理金额格式
    amountStr = amountStr.replace(/[¥,]/g, '');
    const amount = parseFloat(amountStr);
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

// 模拟微信XLSX数据
function testWechatXLSX() {
  console.log('=== 测试微信XLSX账单解析 ===');
  const mockData = [
    ['微信支付交易明细'],
    ['导出时间：2024-01-01 00:00:00'],
    [],
    ['交易时间', '交易类型', '交易对方', '商品', '金额(元)', '交易状态', '交易单号', '商户单号', '备注'],
    ['2024-01-01 12:00:00', '转账', '张三', '转账', '100.00', '已完成', '1234567890', '9876543210', ''],
    ['2024-01-02 13:00:00', '支付', '美团外卖', '美团外卖', '50.00', '已完成', '1234567891', '9876543211', ''],
    ['2024-01-03 14:00:00', '收款', '李四', '转账', '200.00', '已完成', '1234567892', '9876543212', ''],
  ];
  
  const records = parseWechatXLSX(mockData);
  console.log(`解析出 ${records.length} 条记录`);
  console.log('解析结果:', records);
  console.log('=====================\n');
}

// 模拟支付宝XLSX数据
function testAlipayXLSX() {
  console.log('=== 测试支付宝XLSX账单解析 ===');
  const mockData = [
    ['支付宝交易记录明细'],
    ['导出时间：2024-01-01 00:00:00'],
    [],
    ['交易时间', '交易分类', '交易对方', '商品说明', '金额（元）', '收/支', '交易状态', '交易订单号', '商户订单号', '备注'],
    ['2024-01-01 12:00:00', '转账', '张三', '', '100.00', '支出', '交易成功', '1234567890', '9876543210', ''],
    ['2024-01-02 13:00:00', '餐饮', '肯德基', '肯德基快餐', '30.00', '支出', '交易成功', '1234567891', '9876543211', ''],
    ['2024-01-03 14:00:00', '转账', '李四', '', '150.00', '收入', '交易成功', '1234567892', '9876543212', ''],
  ];
  
  const records = parseAlipayXLSX(mockData);
  console.log(`解析出 ${records.length} 条记录`);
  console.log('解析结果:', records);
  console.log('=====================\n');
}

// 运行测试
testWechatXLSX();
testAlipayXLSX();
