export interface ModelParams {
  modelName: string
  modelSize: string
  batchSize: string
  precision: string
  sequenceLength: string
  trainingSteps: string
  usesDistributedTraining: boolean
  memoryUsage: string
  mode: "inference" | "training" // 新增：模式选择
}

export interface GpuRecommendation {
  model: string
  quantity: number
  priceRange: string
  reason: string
  estimatedVram: string
  estimatedMemory: string
}

export interface CommonModel {
  name: string
  parameterCount: number
}

