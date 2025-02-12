import type { GpuRecommendation, ModelParams } from "../types/gpuTypes";
import { getGpuRecommendation } from './gpuRecommendation';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createOllama  } from 'ollama-ai-provider';

const ollama = createOllama({
  // optional settings, e.g.
  baseURL: 'https://gpt.padeoe.com',
});
const systemPrompt = `你是一个专业的 GPU 推荐助手。请根据用户提供的参数，推荐合适的 GPU 配置。
你的回答必须是一个 JSON 对象，包含以下字段：
{
  "model": string,          // 推荐的 GPU 型号
  "quantity": number,       // 需要的 GPU 数量
  "price": number,         // 预估价格（人民币）
  "vramUsage": number,     // 预估显存使用量（GB）
  "systemMemory": number,  // 建议系统内存（GB）
  "reasoning": string,     // 推荐理由
  "alternatives": string[] // 其他可选的 GPU 型号
}`;

interface AIResponse {
  model: string;
  quantity: number;
  price: number;
  vramUsage: number;
  systemMemory: number;
  reasoning: string;
  alternatives: string[];
}

export async function getAIGpuRecommendation(params: ModelParams): Promise<GpuRecommendation> {

  try {
    const timeoutPromise = new Promise<GpuRecommendation>((_, reject) => {
      setTimeout(() => {
        reject(new Error('AI recommendation timeout'));
      }, 20000);
    });

    const aiPromise = (async () => {
      const userPrompt = params.preferredGpu
        ? `User has specifically requested to use ${params.preferredGpu} GPU. Please analyze if this GPU is suitable for their needs:
- Model name: ${params.modelName}
- Model size: ${params.modelSize} parameters
- Batch size: ${params.batchSize}
- Precision: ${params.precision}
- Sequence length: ${params.sequenceLength}
- Training steps: ${params.trainingSteps}
- Distributed training: ${params.usesDistributedTraining ? 'Yes' : 'No'}
- Extra memory usage: ${params.memoryUsage} GB
- Use case: ${params.mode}`
        : `Based on these parameters:
- Model name: ${params.modelName}
- Model size: ${params.modelSize} parameters
- Batch size: ${params.batchSize}
- Precision: ${params.precision}
- Sequence length: ${params.sequenceLength}
- Training steps: ${params.trainingSteps}
- Distributed training: ${params.usesDistributedTraining ? 'Yes' : 'No'}
- Extra memory usage: ${params.memoryUsage} GB
- Use case: ${params.mode}`;

      const response = await fetch('https://gpt.padeoe.com:9443/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-r1:14b',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          stream: false,
          format: 'json',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI recommendation');
      }

      const data = await response.json();
      const aiResponseSchema = z.object({
        model: z.string(),
        quantity: z.number(),
        price: z.number(),
        vramUsage: z.number(),
        systemMemory: z.number(),
        reasoning: z.string(),
        alternatives: z.array(z.string())
      });

      const aiResponse = await generateObject<AIResponse>({
        model: ollama('deepseek-r1:14b'),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: data.message?.content || '' }
        ],
        schema: aiResponseSchema,
        validator: (obj: any): obj is AIResponse => {
          return (
            typeof obj.model === 'string' &&
            typeof obj.quantity === 'number' &&
            typeof obj.price === 'number' &&
            typeof obj.vramUsage === 'number' &&
            typeof obj.systemMemory === 'number' &&
            typeof obj.reasoning === 'string' &&
            Array.isArray(obj.alternatives)
          );
        }
      });

      return {
        model: aiResponse.model,
        quantity: aiResponse.quantity,
        price: aiResponse.price,
        vramUsage: aiResponse.vramUsage,
        systemMemory: aiResponse.systemMemory,
        reasoning: aiResponse.reasoning,
        alternatives: aiResponse.alternatives,
        isAIGenerated: true,
      };
    })();

    return Promise.race([aiPromise, timeoutPromise]);
  } catch (error) {
    console.error('Error getting AI recommendation:', error);
    return {
      ...getGpuRecommendation(params),
      isAIGenerated: false
    };
  }
}
