import axios from 'axios';
import { loadAIConfig } from './ai-config';

interface AIServiceConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
  batchSize: number;
}

interface BillItem {
  id: string;
  description: string;
  amount: number;
  originalCategory: string;
}

interface BillAnalysisResult {
  category: string;
  confidence: number;
  optimizedNote?: string;
}

interface BatchAnalysisResult {
  [billId: string]: BillAnalysisResult;
}

class AIBatchService {
  private config: AIServiceConfig;
  private batchSize: number;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.batchSize = config.batchSize;
  }

  // 将账单数据分批
  private batchBills(bills: BillItem[]): BillItem[][] {
    const batches: BillItem[][] = [];
    for (let i = 0; i < bills.length; i += this.batchSize) {
      batches.push(bills.slice(i, i + this.batchSize));
    }
    return batches;
  }

  // 构建批量分析请求内容
  private buildBatchPrompt(bills: BillItem[]): string {
    let prompt = `你是一个专业的账单分析助手，需要批量分析以下账单数据。

`;
    
    bills.forEach((bill, index) => {
      prompt += `${index + 1}. 账单ID: ${bill.id}\n`;
      prompt += `   描述: ${bill.description}\n`;
      prompt += `   金额: ${bill.amount}元\n`;
      prompt += `   原始分类: ${bill.originalCategory}\n\n`;
    });

    prompt += `请对每条账单进行分析，并返回以下信息：
1. 智能分类：根据描述和金额判断账单类型
2. 备注优化：优化原始描述，使其更清晰、规范

可用分类：餐饮、交通、购物、日用、娱乐、医疗、教育、通讯、服饰、其他

请返回JSON格式，使用账单ID作为键，包含以下字段：
- category: 分类名称
- confidence: 置信度(0-1)
- optimizedNote: 优化后的备注

示例输出：
{
  "bill1": {"category": "餐饮", "confidence": 0.95, "optimizedNote": "美团外卖 - 午餐"},
  "bill2": {"category": "交通", "confidence": 0.9, "optimizedNote": "滴滴打车 - 上班"}
}`;

    return prompt;
  }

  // 批量分析账单
  async batchAnalyzeBills(
    bills: BillItem[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<BatchAnalysisResult> {
    // 加载最新的AI配置
    const latestConfig = loadAIConfig();
    console.log('使用最新AI配置:', latestConfig);
    
    // 更新批处理大小
    this.batchSize = latestConfig.batchSize;
    console.log('开始批量分析账单，总数量:', bills.length, '，批处理大小:', this.batchSize);
    
    const batches = this.batchBills(bills);
    console.log('分为', batches.length, '批进行处理');
    
    const results: BatchAnalysisResult = {};
    let processedCount = 0;
    
    // 报告初始进度
    onProgress?.(0, bills.length);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log('处理批次', i + 1, '/', batches.length, '，数量:', batch.length);
      
      try {
        const prompt = this.buildBatchPrompt(batch);
        console.log('构建的提示词长度:', prompt.length, '字符');
        
        const response = await axios.post(
          latestConfig.apiUrl,
          {
            model: latestConfig.model,
            messages: [
              {
                role: 'system',
                content: '你是一个专业的账单分析助手，擅长批量处理账单数据。'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${latestConfig.apiKey}`
            }
          }
        );

        console.log('AI响应状态:', response.status);
        const batchResult = JSON.parse(response.data.choices[0].message.content);
        console.log('批次分析结果:', batchResult);
        
        // 合并结果
        Object.assign(results, batchResult);
        processedCount += batch.length;
        console.log('已处理:', processedCount, '/', bills.length);
        
        // 报告进度
        onProgress?.(processedCount, bills.length);
        
      } catch (error) {
        console.error('批量分析失败:', error);
        // 失败时为该批次的所有账单设置默认结果
        batch.forEach(bill => {
          results[bill.id] = {
            category: '其他',
            confidence: 0.5,
            optimizedNote: bill.description
          };
        });
        processedCount += batch.length;
        // 即使失败也报告进度
        onProgress?.(processedCount, bills.length);
      }
    }
    
    console.log('批量分析完成，总处理结果数量:', Object.keys(results).length);
    return results;
  }

  // 设置批处理大小
  setBatchSize(size: number) {
    this.batchSize = size;
  }

  // 获取批处理大小
  getBatchSize(): number {
    return this.batchSize;
  }
}

// 创建单例实例
const aiBatchService = new AIBatchService(loadAIConfig());

export { aiBatchService, type BillItem, type BatchAnalysisResult };