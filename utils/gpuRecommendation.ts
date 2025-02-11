import type { GpuRecommendation, ModelParams, GpuSpecs, GpuOption } from "../types/gpuTypes"

// 定义不同精度的内存需求（字节/参数）
const PRECISION_MEMORY_MULTIPLIER = {
  FP32: 4,
  FP16: 2,
  Mixed: 3, // FP32 和 FP16 的平均值
  BF16: 2,
  INT8: 1,
  INT4: 0.5,
}

// 定义 GPU 型号及其规格
export const GPU_SPECS: Record<string, GpuSpecs> = {
  "NVIDIA RTX 3060": {
    vram: 12,
    price: [2500, 3500],
    compute: 1,
    suitable: ["inference"],
    description: "入门级GPU，适合小型模型推理，性价比高",
  },
  "NVIDIA RTX 3090": {
    vram: 24,
    price: [10000, 15000],
    compute: 2,
    suitable: ["training", "inference"],
    description: "高端消费级GPU，适合中小型模型训练和推理",
  },
  "NVIDIA RTX 4090": {
    vram: 24,
    price: [15000, 20000],
    compute: 3,
    suitable: ["training", "inference"],
    description: "最新一代高端消费级GPU，性能强劲",
  },
  "NVIDIA A5000": {
    vram: 24,
    price: [30000, 40000],
    compute: 2.5,
    suitable: ["training", "inference"],
    description: "专业级GPU，稳定性好，适合长时间训练",
  },
  "NVIDIA A6000": {
    vram: 48,
    price: [45000, 55000],
    compute: 3,
    suitable: ["training", "inference"],
    description: "高端专业级GPU，大显存，适合大型模型",
  },
  "NVIDIA A100-40G": {
    vram: 40,
    price: [80000, 100000],
    compute: 4,
    suitable: ["training", "inference"],
    description: "数据中心级GPU，高性能，支持多实例GPU",
  },
  "NVIDIA A100-80G": {
    vram: 80,
    price: [100000, 150000],
    compute: 4,
    suitable: ["training", "inference"],
    description: "大显存数据中心级GPU，适合超大模型",
  },
  "NVIDIA H100": {
    vram: 80,
    price: [250000, 300000],
    compute: 5,
    suitable: ["training", "inference"],
    description: "最新一代数据中心级GPU，性能最强",
  },
} as const

// 导出GPU选项供UI使用
export const GPU_OPTIONS: GpuOption[] = Object.entries(GPU_SPECS).map(([key, specs]) => ({
  value: key,
  label: `${key} (${specs.vram}GB)`,
  description: specs.description,
}))

export function getGpuRecommendation(params: ModelParams): GpuRecommendation {
  // 基础参数转换
  const modelSize = Number.parseInt(params.modelSize)
  const batchSize = Number.parseInt(params.batchSize)
  const sequenceLength = Number.parseInt(params.sequenceLength)
  const memoryUsage = Number.parseInt(params.memoryUsage)
  const isTraining = params.mode === "training"

  // 计算模型基础显存需求
  const precisionMultiplier = PRECISION_MEMORY_MULTIPLIER[params.precision as keyof typeof PRECISION_MEMORY_MULTIPLIER]
  const modelBaseMemory = (modelSize * 1000000 * precisionMultiplier) / (1024 * 1024 * 1024) // GB

  // 计算激活值显存需求
  const tokensPerBatch = batchSize * sequenceLength
  const activationMemory = isTraining
    ? (tokensPerBatch * modelSize * precisionMultiplier * 3) / (1024 * 1024 * 1024) // 训练模式需要更多内存
    : (tokensPerBatch * modelSize * precisionMultiplier) / (1024 * 1024 * 1024)

  // 优化器状态显存（仅训练模式）
  const optimizerMemory = isTraining ? modelBaseMemory * 2 : 0

  // 总显存需求
  const totalVramNeeded = modelBaseMemory + activationMemory + optimizerMemory + memoryUsage

  // 选择合适的 GPU
  let selectedGpu: string | null = null
  let quantity = 1
  let reason = ""
  let alternativeModels: string[] = []

  // 如果用户指定了首选GPU
  if (params.preferredGpu && GPU_SPECS[params.preferredGpu]) {
    const specs = GPU_SPECS[params.preferredGpu]
    if (specs.suitable.includes(params.mode)) {
      selectedGpu = params.preferredGpu
      quantity = Math.ceil(totalVramNeeded / specs.vram)
      reason = `根据您的选择，使用 ${params.preferredGpu}。\n`
    } else {
      reason = `您选择的 ${params.preferredGpu} 不适合${params.mode === "training" ? "训练" : "推理"}场景。\n`
    }
  }

  // 获取所有合适的GPU
  const suitableGpus = Object.entries(GPU_SPECS)
    .filter(([_, specs]) => specs.suitable.includes(params.mode))
    .sort((a, b) => {
      const aCanFit = a[1].vram >= totalVramNeeded
      const bCanFit = b[1].vram >= totalVramNeeded
      if (aCanFit !== bCanFit) return bCanFit ? 1 : -1
      return (a[1].compute / a[1].price[0]) - (b[1].compute / b[1].price[0])
    })

  // 如果没有选择GPU或选择的GPU不合适
  if (!selectedGpu && suitableGpus.length > 0) {
    const [gpuModel, specs] = suitableGpus[0]
    selectedGpu = gpuModel
    quantity = Math.ceil(totalVramNeeded / specs.vram)
  }

  // 生成备选方案
  alternativeModels = suitableGpus
    .slice(0, 3)
    .map(([model]) => model)
    .filter(model => model !== selectedGpu)

  // 补充推荐理由
  reason += `基于您的${params.mode === "training" ? "训练" : "推理"}需求，`
  reason += `模型大小(${modelSize}M参数)，批次大小(${batchSize})和序列长度(${sequenceLength})，`
  reason += `估算需要${totalVramNeeded.toFixed(1)}GB显存。\n`
  
  if (selectedGpu) {
    const specs = GPU_SPECS[selectedGpu]
    reason += `${selectedGpu}提供${specs.vram}GB显存，${specs.description}。`
    
    if (params.precision !== "FP32") {
      reason += `\n使用${params.precision}精度可以减少内存使用。`
    }

    if (quantity > 1) {
      reason += `\n由于总显存需求较大，建议使用${quantity}张显卡进行${
        params.usesDistributedTraining ? "分布式" : "并行"
      }计算。`
    }
  } else {
    selectedGpu = "NVIDIA H100"
    quantity = Math.ceil(totalVramNeeded / GPU_SPECS["NVIDIA H100"].vram)
    reason = "您的需求超出了单卡的显存限制，建议使用多卡H100配置或考虑优化模型参数。"
  }

  const specs = GPU_SPECS[selectedGpu]
  const priceRange = `¥${(specs.price[0] * quantity).toLocaleString()} - ¥${(specs.price[1] * quantity).toLocaleString()}`

  return {
    model: selectedGpu,
    quantity,
    priceRange,
    reason,
    estimatedVram: `${totalVramNeeded.toFixed(1)} GB`,
    estimatedMemory: `${Math.ceil(totalVramNeeded * 1.5)} GB`,
    alternativeModels,
  }
}

