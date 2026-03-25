import { AIServiceConfig, aiService } from './ai-service';

const AI_CONFIG_KEY = 'ai_service_config';

export function loadAIConfig(): AIServiceConfig {
  try {
    const storedConfig = localStorage.getItem(AI_CONFIG_KEY);
    if (storedConfig) {
      const config = JSON.parse(storedConfig);
      // 确保所有必需的字段都存在
      const currentConfig = aiService.getConfig();
      const mergedConfig = { ...currentConfig, ...config };
      aiService.updateConfig(mergedConfig);
      return mergedConfig;
    }
  } catch (error) {
    console.error('加载AI配置失败:', error);
  }
  return aiService.getConfig();
}

export function saveAIConfig(config: Partial<AIServiceConfig>): void {
  try {
    const currentConfig = aiService.getConfig();
    const newConfig = { ...currentConfig, ...config };
    aiService.updateConfig(newConfig);
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(newConfig));
  } catch (error) {
    console.error('保存AI配置失败:', error);
  }
}

export function resetAIConfig(): void {
  try {
    localStorage.removeItem(AI_CONFIG_KEY);
    const defaultConfig: AIServiceConfig = {
      apiKey: '',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-3.5-turbo',
      batchSize: 5
    };
    aiService.updateConfig(defaultConfig);
  } catch (error) {
    console.error('重置AI配置失败:', error);
  }
}