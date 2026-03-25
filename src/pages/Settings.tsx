import { useRef, useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { importBill, exportToCSV, exportToJSON, importFromJSON, type ImportProgress } from '@/lib/import-export'
import { loadAIConfig, saveAIConfig, resetAIConfig } from '@/lib/ai-config'
import {
  Download, Upload, FileText, Smartphone, Shield,
  Database, Trash2, FileJson, FileSpreadsheet, Brain, CreditCard,
} from 'lucide-react'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importTypeRef = useRef<'wechat' | 'alipay' | 'csv' | 'json'>('csv')

  const transactionCount = useLiveQuery(() => db.transactions.count())
  const categoryCount = useLiveQuery(() => db.categories.count())

  // AI配置状态
  const [aiConfig, setAiConfig] = useState({
    apiKey: '',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    batchSize: 5
  })
  
  // 编辑状态
  const [isEditing, setIsEditing] = useState(false)
  const [originalConfig, setOriginalConfig] = useState(aiConfig)

  // 导入进度状态
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  // 加载AI配置
  useEffect(() => {
    const config = loadAIConfig()
    setAiConfig(config)
    setOriginalConfig(config)
  }, [])

  const handleImportClick = (type: 'wechat' | 'alipay' | 'csv' | 'json') => {
    importTypeRef.current = type
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportProgress(null)

    try {
      let count = 0
      if (importTypeRef.current === 'json') {
        const text = await file.text()
        count = await importFromJSON(text)
      } else {
        count = await importBill(file, importTypeRef.current, (progress) => {
          setImportProgress(progress)
        })
      }

      if (count > 0) {
        showToast(`成功导入 ${count} 条记录`)
      } else {
        showToast('未能解析出有效记录，请检查文件格式', 'error')
      }
    } catch {
      showToast('导入失败，请检查文件格式', 'error')
    } finally {
      setIsImporting(false)
      setImportProgress(null)
    }

    e.target.value = ''
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const content = format === 'csv' ? await exportToCSV() : await exportToJSON()
      const blob = new Blob(['\ufeff' + content], {
        type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `轻记账_${new Date().toISOString().split('T')[0]}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      showToast(`${format.toUpperCase()} 文件已导出`)
    } catch {
      showToast('导出失败', 'error')
    }
  }

  const handleClearData = async () => {
    if (!window.confirm('确定要清除所有数据吗？此操作不可撤销！')) return
    await db.transactions.clear()
    showToast('数据已清除')
  }

  // 处理AI配置保存
  const handleAISave = () => {
    saveAIConfig(aiConfig)
    setIsEditing(false)
    showToast('AI配置已保存')
  }

  // 处理AI配置重置
  const handleAIReset = () => {
    resetAIConfig()
    const defaultConfig = {
      apiKey: '',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-3.5-turbo',
      batchSize: 5
    }
    setAiConfig(defaultConfig)
    setOriginalConfig(defaultConfig)
    showToast('AI配置已重置')
  }

  // 处理AI配置编辑
  const handleAIEdit = () => {
    setIsEditing(true)
  }

  // 处理AI配置取消
  const handleAICancel = () => {
    setAiConfig(originalConfig)
    setIsEditing(false)
  }

  return (
    <div className="pb-20 animate-fade-in">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json,.xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="bg-card px-4 pt-12 pb-4 border-b">
        <h1 className="text-lg font-semibold text-foreground">设置</h1>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Data Overview */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm">数据概览</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-foreground tabular-nums">{transactionCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">交易记录</p>
              </div>
              <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-foreground tabular-nums">{categoryCount || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">分类数量</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm">导入数据</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* 导入进度显示 */}
            {isImporting && importProgress && (
              <div className="bg-muted/50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {importProgress.stage === 'parsing' && '正在解析文件...'}
                    {importProgress.stage === 'deduplicating' && '正在去重...'}
                    {importProgress.stage === 'ai-analyzing' && 'AI分析中...'}
                    {importProgress.stage === 'saving' && '正在保存...'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {importProgress.current}/{importProgress.total}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{importProgress.message}</p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => handleImportClick('wechat')}
              disabled={isImporting}
            >
              <div className="w-8 h-8 rounded-lg bg-income/10 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-income" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">微信支付账单</p>
                <p className="text-[10px] text-muted-foreground">支持微信导出的 CSV 文件</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => handleImportClick('alipay')}
              disabled={isImporting}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">支付宝账单</p>
                <p className="text-[10px] text-muted-foreground">支持支付宝导出的 CSV 文件</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => handleImportClick('csv')}
              disabled={isImporting}
            >
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">通用 CSV 文件</p>
                <p className="text-[10px] text-muted-foreground">需包含日期、金额、类型、分类列</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => handleImportClick('json')}
              disabled={isImporting}
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <FileJson className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">JSON 备份文件</p>
                <p className="text-[10px] text-muted-foreground">从本应用导出的备份数据</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Export */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm">导出数据</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => handleExport('csv')}
            >
              <FileSpreadsheet className="w-4 h-4 text-accent-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">导出为 CSV</p>
                <p className="text-[10px] text-muted-foreground">可用 Excel 或 Numbers 打开</p>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => handleExport('json')}
            >
              <FileJson className="w-4 h-4 text-muted-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">导出为 JSON</p>
                <p className="text-[10px] text-muted-foreground">完整数据备份，支持重新导入</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* AI配置 */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm">AI配置</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">API Key</label>
              <Input 
                type="password"
                value={aiConfig.apiKey}
                onChange={(e) => setAiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="输入AI服务的API Key"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">API URL</label>
              <Input 
                value={aiConfig.apiUrl}
                onChange={(e) => setAiConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                placeholder="输入AI服务的API URL"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">模型名称</label>
              <Input 
                value={aiConfig.model}
                onChange={(e) => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
                placeholder="输入AI模型名称"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">批量分析服务大小</label>
              <Input 
                type="number"
                min="1"
                max="50"
                value={aiConfig.batchSize}
                onChange={(e) => setAiConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 5 }))}
                placeholder="输入批量分析服务大小"
                disabled={!isEditing}
              />
            </div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button 
                  onClick={handleAISave}
                  className="flex-1"
                >
                  保存
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleAICancel}
                  className="flex-1"
                >
                  取消
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={handleAIEdit}
                  className="flex-1"
                >
                  编辑
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleAIReset}
                  className="flex-1"
                >
                  重置
                </Button>
              </div>
            )}
            <div className="bg-accent/50 rounded-xl p-3">
              <p className="text-xs text-accent-foreground leading-relaxed">
                配置AI服务后，系统将在导入账单时自动进行智能分类和备注优化。
                推荐使用OpenAI API或其他兼容的AI服务。
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p className="text-xs text-yellow-800 leading-relaxed">
                提示：批量分析服务大小设置过大可能导致文本量过大，账单分析结果可能不完整。
                建议根据AI模型的上下文窗口限制合理设置，一般建议不超过10。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 支付方式管理 */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm">支付方式管理</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => navigate('/payment-methods')}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">管理支付方式</p>
                <p className="text-[10px] text-muted-foreground">添加、编辑和设置默认支付方式</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm">隐私安全</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-accent/50 rounded-xl p-3">
              <p className="text-xs text-accent-foreground leading-relaxed">
                您的所有数据均存储在本地设备中，不会上传至任何服务器。
                应用完全离线运行，无需网络连接即可使用全部功能。
                当使用AI功能时，账单描述会发送至您配置的AI服务。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-expense" />
              <CardTitle className="text-sm text-expense">危险操作</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleClearData}
            >
              清除所有交易数据
            </Button>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              建议在清除前先导出数据备份
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
