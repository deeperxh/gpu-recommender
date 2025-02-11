"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getGpuRecommendation } from "../utils/gpuRecommendation"
import type { GpuRecommendation, ModelParams } from "../types/gpuTypes"
import { commonModels } from "../data/commonModels"

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

  useEffect(() => {
    const result = getGpuRecommendation(modelParams)
    setRecommendation(result)
  }, [modelParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">AI 模型 GPU 推荐器</h1>
          <p className="mt-2 text-lg text-gray-600">为您的 AI 项目找到最佳 GPU 配置</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600">
              <CardTitle className="text-xl text-white">模型参数</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
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
            </CardContent>
          </Card>

          {recommendation && (
            <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600">
                <CardTitle className="text-xl text-white">GPU 推荐</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">推荐型号</h3>
                  <p className="text-2xl font-semibold text-gray-900">{recommendation.model}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">推荐数量</h3>
                  <p className="text-2xl font-semibold text-gray-900">{recommendation.quantity}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">估计价格范围</h3>
                  <p className="text-xl font-semibold text-green-600">{recommendation.priceRange}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">估计所需显存</h3>
                  <p className="text-xl font-semibold text-blue-600">{recommendation.estimatedVram}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">估计所需系统内存</h3>
                  <p className="text-xl font-semibold text-purple-600">{recommendation.estimatedMemory}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700">推荐理由</h3>
                  <p className="text-sm text-gray-600">{recommendation.reason}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="bg-gray-100 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>© 2023 AI 模型 GPU 推荐器. 所有权利保留.</p>
        </div>
      </footer>
    </div>
  )
}

