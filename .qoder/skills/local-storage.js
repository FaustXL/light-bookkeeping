// Local Storage Skill - 本地存储技能配置
// 管理轻记账应用的IndexedDB本地数据层
module.exports = {
  name: 'local-storage',
  description: '基于Dexie.js的IndexedDB本地数据存储管理',

  database: {
    name: 'LightBookkeeping',
    version: 1,
    tables: {
      transactions: {
        keyPath: '++id',
        indexes: ['type', 'categoryId', 'date', 'createdAt'],
        schema: {
          id: 'number (auto)',
          amount: 'number',
          type: "'income' | 'expense'",
          categoryId: 'number',
          categoryName: 'string',
          note: 'string',
          date: 'Date',
          createdAt: 'Date',
        },
      },
      categories: {
        keyPath: '++id',
        indexes: ['type', 'order'],
        schema: {
          id: 'number (auto)',
          name: 'string',
          icon: 'string (lucide icon name)',
          type: "'income' | 'expense'",
          color: 'string (hex color)',
          order: 'number',
        },
      },
    },
  },

  defaultCategories: {
    expense: ['餐饮', '交通', '购物', '日用', '娱乐', '医疗', '教育', '通讯', '服饰', '其他'],
    income: ['工资', '奖金', '投资', '兼职', '红包', '其他'],
  },

  patterns: {
    reactiveQuery: "useLiveQuery(() => db.transactions.where('date').between(start, end).toArray(), [deps])",
    addTransaction: "await db.transactions.add({ amount, type, categoryId, categoryName, note, date, createdAt })",
    bulkImport: "await db.transactions.bulkAdd(transactions)",
    clearData: "await db.transactions.clear()",
  },

  privacyPolicy: [
    '所有数据仅存储在浏览器IndexedDB中',
    '不发起任何网络请求，完全离线运行',
    '数据导出由用户主动触发，通过Blob URL下载',
    '清除数据需用户确认，操作不可撤销',
  ],
};
