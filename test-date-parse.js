// 测试日期解析问题

// 模拟微信和支付宝账单中的日期格式
const testDates = [
  '2024-01-01 12:00:00',  // 微信标准格式
  '2024/01/01 12:00:00',  // 可能的格式
  '2024年01月01日 12:00:00',  // 支付宝标准格式
  '2024-01-01',  // 只包含日期
  '2024/01/01',  // 只包含日期
  '01/01/2024',  // 月/日/年格式
  '01-01-2024',  // 月-日-年格式
];

console.log('测试不同日期格式的解析结果:');
console.log('=================================');

testDates.forEach(dateStr => {
  const date = new Date(dateStr);
  console.log(`原始日期: "${dateStr}"`);
  console.log(`解析结果: ${date}`);
  console.log(`是否有效: ${isNaN(date.getTime()) ? '无效' : '有效'}`);
  console.log('---------------------------------');
});

// 测试XLSX可能返回的日期格式
console.log('\n测试XLSX可能返回的日期格式:');
console.log('=================================');

// XLSX有时会将日期存储为数字（Excel序列号）
const excelDateSerial = 45292; // 对应2024-01-01
const dateFromSerial = new Date((excelDateSerial - 25569) * 86400 * 1000);
console.log(`Excel序列号: ${excelDateSerial}`);
console.log(`解析结果: ${dateFromSerial}`);
console.log(`是否有效: ${isNaN(dateFromSerial.getTime()) ? '无效' : '有效'}`);
console.log('---------------------------------');

// 测试日期字符串的标准化处理
console.log('\n测试日期字符串的标准化处理:');
console.log('=================================');

function normalizeDate(dateStr) {
  if (!dateStr) return null;
  
  // 移除中文字符
  let normalized = dateStr.replace(/[年月日]/g, '-').replace(/\s+/g, ' ');
  
  // 处理不同的日期分隔符
  normalized = normalized.replace(/\//g, '-');
  
  // 处理月/日/年格式
  const mdYPattern = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/;
  if (mdYPattern.test(normalized)) {
    const match = normalized.match(mdYPattern);
    if (match) {
      normalized = `${match[3]}-${match[1]}-${match[2]} ${normalized.split(' ')[1] || ''}`;
    }
  }
  
  return normalized;
}

testDates.forEach(dateStr => {
  const normalized = normalizeDate(dateStr);
  const date = new Date(normalized);
  console.log(`原始日期: "${dateStr}"`);
  console.log(`标准化后: "${normalized}"`);
  console.log(`解析结果: ${date}`);
  console.log(`是否有效: ${isNaN(date.getTime()) ? '无效' : '有效'}`);
  console.log('---------------------------------');
});
