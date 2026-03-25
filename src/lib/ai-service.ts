import axios from 'axios';

interface AIServiceConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
  batchSize: number;
}

interface BillAnalysisResult {
  category: string;
  confidence: number;
  optimizedNote?: string;
}

class AIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  async analyzeBill(description: string, amount: number): Promise<BillAnalysisResult> {
    console.log('开始AI分析:', { description, amount });
    console.log('使用的AI配置:', this.config);
    
    try {
      const response = await axios.post(
        this.config.apiUrl,
        {
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: `你是一个专业的账单分析助手，需要完成以下任务：
1. 智能分类：根据描述和金额判断账单类型
2. 备注优化：优化原始描述，使其更清晰、规范

可用分类：餐饮、交通、购物、日用、娱乐、医疗、教育、通讯、服饰、其他

请返回JSON格式，包含以下字段：
- category: 分类名称
- confidence: 置信度(0-1)
- optimizedNote: 优化后的备注

示例输出：
{"category": "餐饮", "confidence": 0.95, "optimizedNote": "美团外卖 - 午餐"}`
            },
            {
              role: 'user',
              content: `描述：${description}，金额：${amount}元`
            }
          ],
          temperature: 0.3
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      console.log('AI分析响应:', response.data);
      const result = JSON.parse(response.data.choices[0].message.content);
      console.log('AI分析结果:', result);
      return result;
    } catch (error) {
      console.error('AI分析失败:', error);
      // 失败时返回默认结果
      return {
        category: '其他',
        confidence: 0.5,
        optimizedNote: description
      };
    }
  }

  updateConfig(config: Partial<AIServiceConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AIServiceConfig {
    return { ...this.config };
  }
}

// 默认配置
const defaultConfig: AIServiceConfig = {
  apiKey: '',
  apiUrl: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
  batchSize: 5
};

// 创建单例实例
const aiService = new AIService(defaultConfig);

export { aiService, type AIServiceConfig, type BillAnalysisResult };