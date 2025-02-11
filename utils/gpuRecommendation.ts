import type { GpuRecommendation, ModelParams } from "../types/gpuTypes"

export function getGpuRecommendation(params: ModelParams): GpuRecommendation {
  const modelSize = Number.parseInt(params.modelSize)
  const batchSize = Number.parseInt(params.batchSize)
  const sequenceLength = Number.parseInt(params.sequenceLength)
  const trainingSteps = Number.parseInt(params.trainingSteps)
  const memoryUsage = Number.parseInt(params.memoryUsage)
  const isTraining = params.mode === "training"

  let model: string
  let quantity: number
  let priceRange: string
  let reason: string
  let estimatedVram: string
  let estimatedMemory: string

  // 估算显存需求（粗略计算，实际需求可能有所不同）
  const vramPerParams = params.precision === "FP16" ? 2 : 4 // 字节/参数
  const totalParamsMemory = (modelSize * 1000000 * vramPerParams) / (1024 * 1024 * 1024) // 转换为 GB

  let vramForActivations = 0
  if (isTraining) {
    // 训练模式：需要更多内存用于反向传播和优化器状态
    vramForActivations = (batchSize * sequenceLength * modelSize * vramPerParams * 3) / (1024 * 1024 * 1024) // 转换为 GB
  } else {
    // 推理模式：只需要前向传播的内存
    vramForActivations = (batchSize * sequenceLength * modelSize * vramPerParams) / (1024 * 1024 * 1024) // 转换为 GB
  }

  const totalVramNeeded = totalParamsMemory + vramForActivations

  // 估算系统内存需求
  const estimatedSystemMemory = memoryUsage + (isTraining ? totalVramNeeded : totalParamsMemory)

  // 基本逻辑
  if (totalVramNeeded < 24) {
    model = "NVIDIA RTX 3090"
    quantity = 1
    priceRange = "¥10,000 - ¥15,000"
    reason = `对于${isTraining ? "训练" : "推理"}这种规模的模型，单个高端消费级GPU就足够了。`
  } else if (totalVramNeeded < 48) {
    model = "NVIDIA RTX 4090"
    quantity = Math.ceil(totalVramNeeded / 24)
    priceRange = `¥${quantity * 15000} - ¥${quantity * 20000}`
    reason = `RTX 4090提供了良好的性能和足够的显存，适合${isTraining ? "训练" : "推理"}中等规模的模型。`
  } else if (totalVramNeeded < 320) {
    model = "NVIDIA A100"
    quantity = Math.ceil(totalVramNeeded / 80)
    priceRange = `¥${quantity * 100000} - ¥${quantity * 150000}`
    reason = `A100提供大容量显存和高性能，适合${isTraining ? "训练" : "推理"}大规模模型。`
  } else {
    model = "NVIDIA H100"
    quantity = Math.ceil(totalVramNeeded / 80)
    priceRange = `¥${quantity * 250000} - ¥${quantity * 300000}`
    reason = `对于${isTraining ? "训练" : "推理"}超大规模模型或极高显存需求，H100是最佳选择。`
  }

  estimatedVram = `${totalVramNeeded.toFixed(2)} GB`
  estimatedMemory = `${estimatedSystemMemory.toFixed(2)} GB`

  // 考虑精度
  reason +=
    params.precision === "FP16"
      ? " FP16精度可以减少内存使用并提高计算速度。"
      : params.precision === "Mixed"
        ? " 混合精度可以在保持精度的同时提高性能。"
        : " FP32精度提供最高的计算精度，但可能会降低速度。"

  // 考虑分布式设置
  if (params.usesDistributedTraining && isTraining) {
    quantity = Math.max(quantity, 2)
    reason += " 考虑到分布式训练需求，建议使用多个GPU。"
  }

  // 针对推理模式的特殊考虑
  if (!isTraining) {
    reason += " 推理模式通常需要较少的显存，因为不需要存储梯度和优化器状态。"
    if (quantity > 1) {
      reason += " 多个GPU可用于并行处理多个推理请求，提高吞吐量。"
    }
  }

  return { model, quantity, priceRange, reason, estimatedVram, estimatedMemory }
}

