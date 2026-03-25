# 轻记账 (Light Bookkeeping)

## 1. Project Overview

轻记账是一款简洁高效的离线记账应用，专注于保护用户隐私安全。它允许用户轻松记录、管理和分析个人财务数据，所有数据均存储在本地设备，无需网络连接即可使用全部功能。

核心功能包括：智能账单分类、多格式账单导入、数据导出、支付方式管理、批量处理大量账单数据等。应用采用现代前端技术栈构建，支持跨平台部署为Web和移动应用。

## 2. Features

### 核心功能

- **完全离线运行**：所有数据存储在本地设备，无需网络连接，保护用户隐私
- **智能AI分析**：集成AI功能，自动分类账单并优化备注信息
- **多格式账单导入**：支持微信、支付宝账单导入，兼容CSV和XLSX格式
- **数据导出**：支持导出为CSV和JSON格式，方便备份和迁移
- **支付方式管理**：自定义和管理支付方式，设置默认支付方式
- **批量处理**：高效处理大量账单数据，支持导入进度显示
- **智能去重**：自动检测并处理重复账单记录
- **视觉优化**：根据账单来源显示不同的渐变背景，提升用户体验
- **数据概览**：提供交易记录和分类数量的统计信息

### 技术实现

- **前端框架**：React + TypeScript
- **状态管理**：React useState + useEffect
- **路由**：React Router
- **数据库**：Dexie.js (IndexedDB)
- **构建工具**：Vite
- **样式**：Tailwind CSS
- **图表**：Chart.js
- **文件解析**：PapaParse (CSV) + XLSX (Excel)
- **移动应用**：Capacitor
- **AI集成**：支持OpenAI API和其他兼容AI服务

## 3. Prerequisites

在安装和运行项目之前，确保您的系统满足以下要求：

- **Node.js**：版本 16.0 或更高
- **npm**：版本 7.0 或更高
- **Git**：用于克隆仓库
- **浏览器**：现代Web浏览器（Chrome、Firefox、Safari、Edge）
- **移动开发（可选）**：
  - Android Studio（用于Android构建）
  - Xcode（用于iOS构建，仅macOS）

## 4. Installation Guide

### 步骤1：克隆仓库

```bash
git clone https://github.com/yourusername/light-bookkeeping.git
cd light-bookkeeping
```

### 步骤2：安装依赖

```bash
npm install
```

### 步骤3：启动开发服务器

```bash
npm run dev
```

开发服务器将在 `http://localhost:5173` 启动。

## 5. Configuration

### 基本配置

项目的基本配置位于以下文件：

- **`capacitor.config.ts`**：配置应用ID、应用名称和Web目录
- **`package.json`**：配置项目依赖和脚本
- **`vite.config.ts`**：配置Vite构建选项

### AI服务配置

要使用AI功能，需要在应用设置页面配置AI服务：

1. 打开应用，导航到「设置」页面
2. 点击「AI配置」部分的「编辑」按钮
3. 输入以下信息：
   - **API Key**：您的AI服务API密钥
   - **API URL**：AI服务的API端点（默认为 `https://api.openai.com/v1/chat/completions`）
   - **模型名称**：AI模型名称（默认为 `gpt-3.5-turbo`）
   - **批量分析服务大小**：批处理大小（默认为 5，建议不超过10）
4. 点击「保存」按钮

## 6. Usage Instructions

### 基本使用流程

1. **添加交易**：点击底部导航栏的「+」按钮，填写交易信息并保存
2. **查看交易**：点击底部导航栏的「明细」按钮，查看所有交易记录
3. **查看统计**：点击底部导航栏的「统计」按钮，查看财务统计数据
4. **导入账单**：在「设置」页面，选择「导入数据」部分的相应选项，上传账单文件
5. **导出数据**：在「设置」页面，选择「导出数据」部分的相应选项，导出数据文件
6. **管理支付方式**：在「设置」页面，点击「支付方式管理」，添加、编辑和设置默认支付方式

### 导入账单

1. 从微信或支付宝导出账单文件
2. 在「设置」页面，点击相应的导入按钮
3. 选择导出的账单文件
4. 等待导入完成，查看导入结果

### AI分析

1. 在「设置」页面配置AI服务
2. 导入账单或添加新交易
3. 系统会自动使用AI进行账单分类和备注优化

## 7. Deployment Process

### 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist` 目录中。

### 部署为Web应用

1. 构建生产版本
2. 将 `dist` 目录中的文件部署到您选择的Web服务器或静态网站托管服务（如Vercel、Netlify、GitHub Pages等）

### 部署为移动应用

#### Android

```bash
npx cap add android
npx cap copy
npx cap open android
```

在Android Studio中构建和签名APK。

#### iOS

```bash
npx cap add ios
npx cap copy
npx cap open ios
```

在Xcode中构建和签名IPA。

## 8. Troubleshooting

### 常见问题

1. **导入账单失败**
   - 原因：文件格式不正确或文件损坏
   - 解决方案：确保使用正确格式的账单文件，尝试重新导出账单
2. **AI分析失败**
   - 原因：API Key无效或网络连接问题
   - 解决方案：检查AI配置，确保API Key正确，确保设备有网络连接
3. **数据丢失**
   - 原因：浏览器清除数据或应用被卸载
   - 解决方案：定期导出数据备份，使用JSON格式导出以保留完整数据
4. **应用运行缓慢**
   - 原因：交易记录过多
   - 解决方案：定期清理不需要的交易记录，使用数据导出功能备份后清除数据

### 错误处理

- **TypeScript编译错误**：运行 `npm run build` 检查并修复TypeScript错误
- **依赖问题**：删除 `node_modules` 目录并重新运行 `npm install`
- **Capacitor构建错误**：确保Android Studio或Xcode已正确安装并配置

## 9. Contributing Guidelines

欢迎贡献代码和改进！请遵循以下流程：

1. Fork仓库
2. 创建功能分支（`git checkout -b feature/AmazingFeature`）
3. 提交更改（`git commit -m 'Add some AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 打开Pull Request

### 代码规范

- 遵循TypeScript编码规范
- 使用ESLint和Prettier保持代码风格一致
- 为新功能添加适当的注释和文档
- 确保所有测试通过

## 10. License Information

本项目采用 MIT 许可证，版权归 2026 FaustXL 所有。详见 [LICENSE](LICENSE) 文件。

***

**轻记账** - 让记账变得简单、安全、高效！
