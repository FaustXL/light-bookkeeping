// Accounting Agent - 记账应用专用代理配置
// 用于辅助轻记账应用的开发和维护
module.exports = {
  name: 'accounting-agent',
  description: '轻记账应用开发代理，负责记账功能的开发、调试和维护',
  
  context: {
    projectType: 'mobile-first-pwa',
    framework: 'React + TypeScript + Vite',
    database: 'Dexie.js (IndexedDB)',
    styling: 'Tailwind CSS',
    charts: 'Chart.js + react-chartjs-2',
    
    architecture: {
      pages: [
        'Dashboard - 首页仪表盘，余额总览',
        'AddTransaction - 记账页面，收支录入',
        'Transactions - 交易明细列表，搜索筛选',
        'Statistics - 统计分析，图表展示',
        'Settings - 设置页，数据导入导出',
      ],
      coreModules: [
        'src/lib/db.ts - Dexie数据库定义和初始化',
        'src/lib/import-export.ts - 数据导入导出（微信/支付宝/CSV/JSON）',
        'src/lib/utils.ts - 工具函数',
      ],
      components: [
        'src/components/BottomNav.tsx - 底部导航栏',
        'src/components/CategoryIcon.tsx - 分类图标组件',
        'src/components/TransactionItem.tsx - 交易条目组件',
        'src/components/EmptyState.tsx - 空状态展示',
        'src/components/ui/ - 基础UI组件（Button, Card, Toast）',
      ],
    },
  },

  rules: [
    '所有数据存储在本地IndexedDB，不得发起任何网络请求',
    '使用Dexie.js操作数据库，通过useLiveQuery实现响应式数据',
    '遵循移动端优先的设计原则，所有交互适配触屏操作',
    '保持白色基调的设计风格，使用薄荷绿(--primary)作为主题色',
    '金额显示使用tabular-nums确保数字对齐',
    '收入显示绿色(--income)，支出使用默认前景色',
  ],
};
