"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getGpuRecommendation, GPU_OPTIONS, GPU_SPECS } from "@/utils/gpuRecommendation"
import { getAIGpuRecommendation } from "@/utils/aiRecommendation"
import type { GpuRecommendation, ModelParams } from "@/types/gpuTypes"
import { commonModels } from "@/data/commonModels"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"

export default function GpuRecommender() {
  const [modelParams, setModelParams] = useState<ModelParams>({
    modelName: "Custom",
    modelSize: "1000",
    batchSize: "32",
    precision: "Mixed",
    sequenceLength: "2048",
    trainingSteps: "100000",
    usesDistributedTraining: false,
    memoryUsage: "32",
    mode: "training",
  })
  const [recommendation, setRecommendation] = useState<GpuRecommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const handleInputChange = (name: string, value: string | number | boolean) => {
    setModelParams((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleModelSelect = (modelName: string) => {
    const selectedModel = commonModels.find((model) => model.name === modelName)
    if (selectedModel) {
      setModelParams((prev) => ({
        ...prev,
        modelName: selectedModel.name,
        modelSize: selectedModel.parameterCount.toString(),
      }))
    } else {
      setModelParams((prev) => ({
        ...prev,
        modelName: "Custom",
      }))
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    console.log('API Key:', process.env.NEXT_PUBLIC_OPENROUTER_API_KEY); 
    try {
      const params: ModelParams = {
        modelName: modelParams.modelName || "",  
        modelSize: modelParams.modelSize.toString(),
        batchSize: modelParams.batchSize.toString(),
        precision: modelParams.precision,
        sequenceLength: "512",  
        trainingSteps: "1000",  
        usesDistributedTraining: false,  
        memoryUsage: modelParams.memoryUsage.toString(),
        mode: modelParams.mode,
        preferredGpu: modelParams.preferredGpu  
      }
      const result = await getAIGpuRecommendation(params)
      setRecommendation(result)
      setShowResult(true)
    } catch (error) {
      console.error('Error getting recommendation:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <header className="relative overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30" />
        <div className="relative z-10 container mx-auto px-4">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="inline-flex items-center justify-center p-2 mb-4 rounded-full bg-blue-50 dark:bg-blue-950/50">
              <svg 
                className="w-6 h-6 text-blue-600 dark:text-blue-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
              AI 模型 GPU 推荐器
            </h1>
            <p className="max-w-2xl text-slate-600 dark:text-slate-400">
              智能分析您的 AI 项目需求，为您推荐最适合的 GPU 配置方案
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-2">
          <Card className="relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30 pointer-events-none" />
            
            <CardHeader className="relative space-y-1 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                  <svg 
                    className="w-5 h-5 text-blue-600 dark:text-blue-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM9 9h6v6H9V9z"
                    />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                    模型配置
                  </CardTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    设置您的模型参数和训练需求
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative space-y-6 p-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">使用场景</Label>
                <RadioGroup
                  defaultValue={modelParams.mode}
                  onValueChange={(value) => handleInputChange("mode", value)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="training" id="training" className="peer sr-only" />
                    <Label
                      htmlFor="training"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all duration-300 ease-in-out cursor-pointer h-full"
                    >
                      <div className="flex flex-col items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-6 h-6 mb-2"
                        >
                          <path d="M12 8v4l3 3" />
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                        <span className="font-semibold mb-1">模型训练</span>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        用于训练新模型或微调现有模型，需要更多计算资源
                      </p>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="inference" id="inference" className="peer sr-only" />
                    <Label
                      htmlFor="inference"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary transition-all duration-300 ease-in-out cursor-pointer h-full"
                    >
                      <div className="flex flex-col items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-6 h-6 mb-2"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          <path d="M12 8v4" />
                          <path d="M12 16h.01" />
                        </svg>
                        <span className="font-semibold mb-1">模型推理</span>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        用于部署已训练好的模型，进行预测和生成，资源需求相对较少
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label htmlFor="modelSelect" className="text-sm font-medium text-gray-700">
                  选择模型
                </Label>
                <Select value={modelParams.modelName} onValueChange={handleModelSelect}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="选择模型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Custom">自定义</SelectItem>
                    {commonModels.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        {model.name} ({model.parameterCount}M 参数)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="modelSize" className="text-sm font-medium text-gray-700">
                  模型大小 (百万参数)
                </Label>
                <Input
                  id="modelSize"
                  type="number"
                  value={modelParams.modelSize}
                  onChange={(e) => handleInputChange("modelSize", e.target.value)}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <Label htmlFor="batchSize" className="text-sm font-medium text-gray-700">
                  批次大小
                </Label>
                <Slider
                  id="batchSize"
                  min={1}
                  max={128}
                  step={1}
                  value={[Number.parseInt(modelParams.batchSize)]}
                  onValueChange={(value) => handleInputChange("batchSize", value[0].toString())}
                  className="mt-2"
                />
                <div className="text-center mt-1 text-sm text-gray-600">{modelParams.batchSize}</div>
              </div>
              <div>
                <Label htmlFor="precision" className="text-sm font-medium text-gray-700">
                  精度
                </Label>
                <Select value={modelParams.precision} onValueChange={(value) => handleInputChange("precision", value)}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="选择精度" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FP16">FP16 (半精度浮点数, 16位)</SelectItem>
                    <SelectItem value="FP32">FP32 (单精度浮点数, 32位)</SelectItem>
                    <SelectItem value="Mixed">混合精度 (动态调整FP16/FP32)</SelectItem>
                    <SelectItem value="BF16">BF16 (脑浮点数, 16位)</SelectItem>
                    <SelectItem value="INT8">INT8 (8位整数量化)</SelectItem>
                    <SelectItem value="INT4">INT4 (4位整数量化)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sequenceLength" className="text-sm font-medium text-gray-700">
                  序列长度
                </Label>
                <Input
                  id="sequenceLength"
                  type="number"
                  value={modelParams.sequenceLength}
                  onChange={(e) => handleInputChange("sequenceLength", e.target.value)}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <Label htmlFor="trainingSteps" className="text-sm font-medium text-gray-700">
                  训练步数
                </Label>
                <Input
                  id="trainingSteps"
                  type="number"
                  value={modelParams.trainingSteps}
                  onChange={(e) => handleInputChange("trainingSteps", e.target.value)}
                  className="w-full mt-1"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="usesDistributedTraining"
                  checked={modelParams.usesDistributedTraining}
                  onCheckedChange={(checked) => handleInputChange("usesDistributedTraining", checked)}
                />
                <Label htmlFor="usesDistributedTraining" className="text-sm font-medium text-gray-700">
                  使用分布式训练
                </Label>
              </div>
              <div>
                <Label htmlFor="memoryUsage" className="text-sm font-medium text-gray-700">
                  额外内存使用量 (GB)
                </Label>
                <Input
                  id="memoryUsage"
                  type="number"
                  value={modelParams.memoryUsage}
                  onChange={(e) => handleInputChange("memoryUsage", e.target.value)}
                  className="w-full mt-1"
                />
              </div>
              <div>
                <Label htmlFor="preferredGpu" className="text-sm font-medium text-gray-700">
                  首选 GPU 型号（可选）
                </Label>
                <Select 
                  value={modelParams.preferredGpu || "auto"} 
                  onValueChange={(value) => handleInputChange("preferredGpu", value === "auto" ? "" : value)}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="选择 GPU 型号" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自动推荐</SelectItem>
                    {GPU_OPTIONS.map((gpu) => (
                      <SelectItem key={gpu.value} value={gpu.value}>
                        <div>
                          <div>{gpu.label}</div>
                          <div className="text-xs text-gray-500">{gpu.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-md transition-colors duration-200"
                >
                  {loading ? "生成推荐方案中..." : "获取 GPU 推荐"}
                </button>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <Card className="relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
                <div className="animate-pulse">
                  <svg 
                    className="w-16 h-16 text-blue-500 dark:text-blue-400 animate-spin" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    正在为您生成 GPU 推荐方案
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    请稍候，我们正在分析您的需求并推荐最佳 GPU 配置
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : !recommendation ? (
            <Card className="relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
                <div className="p-6 rounded-full bg-blue-50 dark:bg-blue-950/50">
                  <svg 
                    className="w-16 h-16 text-blue-500 dark:text-blue-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    GPU 推荐助手
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md text-center">
                    填写您的深度学习或 AI 训练需求，点击"获取 GPU 推荐"，我们将为您推荐最适合的 GPU 配置
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 shadow-lg hover:shadow-xl transition-all duration-300">
              {/* 推荐来源标签 */}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                recommendation.isAIGenerated 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              }`}>
                {recommendation.isAIGenerated ? 'AI 生成' : '规则生成'}
              </div>

              <CardHeader className="relative space-y-1 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                      <svg 
                        className="w-5 h-5 text-blue-600 dark:text-blue-400" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                        />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                        {recommendation.model}
                      </CardTitle>
                      <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                        <span>
                          {recommendation.isAIGenerated 
                            ? 'AI 智能推荐' 
                            : '基于规则的推荐'}
                        </span>
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <svg 
                                className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                />
                              </svg>
                            </TooltipTrigger>
                            <TooltipContent 
                              side="bottom" 
                              align="start"
                              className="bg-white border border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white max-w-xs p-3 rounded-lg shadow-lg z-50"
                            >
                              {recommendation.isAIGenerated ? (
                                <>
                                  <div className="font-semibold text-sm mb-2">AI 智能推荐</div>
                                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                                    <p>使用 Claude-3-Opus 大语言模型，通过深入分析您的具体需求，智能推荐最佳 GPU 配置。</p>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium">AI 模型:</span>
                                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">Claude-3-Opus</span>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="font-semibold text-sm mb-2">基于规则的推荐</div>
                                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                                    <p>根据预定义的硬件配置规则和经验公式，为您推荐适合的 GPU 方案。</p>
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium">规则依据:</span>
                                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">模型大小</span>
                                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">批次大小</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium">计算方法:</span>
                                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">线性估算</span>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-8 p-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">推荐型号</h3>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-white">{recommendation.model}</p>
                    </div>
                    <div className="absolute -right-2 -top-2 p-3 text-blue-600/20 dark:text-blue-400/20">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">数量</h3>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-white">{recommendation.quantity}</p>
                    </div>
                    <div className="absolute -right-2 -top-2 p-3 text-emerald-600/20 dark:text-emerald-400/20">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">价格范围</h3>
                      <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{recommendation.priceRange}</p>
                    </div>
                    <div className="absolute -right-2 -top-2 p-3 text-purple-600/20 dark:text-purple-400/20">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">所需显存</h3>
                        <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">{recommendation.estimatedVram}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">系统内存</h3>
                        <p className="text-xl font-semibold text-purple-600 dark:text-purple-400">{recommendation.estimatedMemory}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {recommendation && recommendation.alternativeModels && recommendation.alternativeModels.length > 0 && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">备选方案</h3>
                      </div>
                      <div className="space-y-2">
                        {recommendation.alternativeModels?.map((model) => (
                          <div key={model} className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
                            <span>•</span>
                            <span>{model}{GPU_SPECS[model]?.description ? ` - ${GPU_SPECS[model].description}` : ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {recommendation && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">推荐理由</h3>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{recommendation.reason}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="mt-12 py-6 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <p> {new Date().getFullYear()} AI 模型 GPU 推荐器</p>
        </div>
      </footer>
    </div>
  )
}
