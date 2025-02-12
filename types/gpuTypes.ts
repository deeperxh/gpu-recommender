export interface ModelParams {
  modelName: string
  modelSize: string
  batchSize: string
  precision: string
  sequenceLength: string
  trainingSteps: string
  usesDistributedTraining: boolean
  memoryUsage: string
  mode: "inference" | "training"
  preferredGpu?: string
  budget?: number  // Budget in CNY
}

export interface GpuRecommendation {
  model: string;
  quantity: number;
  priceRange: string;
  reason: string;
  estimatedVram: string;
  estimatedMemory: string;
  alternativeModels: string[];
  isAIGenerated: boolean;
}

export interface GpuSpecs {
  vram: number
  price: [number, number]
  compute: number
  suitable: string[]
  description: string
}

export interface GpuOption {
  value: string
  label: string
  description: string
}

export interface CommonModel {
  name: string
  parameterCount: number
}
