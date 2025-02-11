import type { CommonModel } from "../types/gpuTypes"

export const commonModels: CommonModel[] = [
  { name: "GPT-3", parameterCount: 175000 },
  { name: "GPT-4", parameterCount: 1000000 }, // 估计值，实际参数量未公开
  { name: "BLOOM-176B", parameterCount: 176000 },
  { name: "LLaMA 7B", parameterCount: 7000 },
  { name: "LLaMA 13B", parameterCount: 13000 },
  { name: "LLaMA 33B", parameterCount: 33000 },
  { name: "LLaMA 65B", parameterCount: 65000 },
  { name: "PaLM", parameterCount: 540000 },
  { name: "Chinchilla", parameterCount: 70000 },
  { name: "BERT-large", parameterCount: 340 },
  { name: "T5-11B", parameterCount: 11000 },
  { name: "Megatron-Turing NLG", parameterCount: 530000 },
]

