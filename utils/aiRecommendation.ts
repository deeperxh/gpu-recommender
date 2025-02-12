import type { GpuRecommendation, ModelParams } from "../types/gpuTypes";
import { getGpuRecommendation } from './gpuRecommendation';

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

const systemPrompt = `You are a GPU recommendation expert specializing in deep learning hardware requirements. Your task is to recommend suitable GPU configurations based on the provided parameters.

Please follow these guidelines:
1. Memory Calculation:
   - Consider model size, batch size, and sequence length for VRAM requirements
   - Account for mixed precision, FP16, or quantization effects
   - Include gradient memory for training tasks
   - Factor in optimizer states and extra memory usage

2. Training vs Inference:
   - Training needs more VRAM for gradients and optimizer states
   - Inference can use lower precision and less memory
   - Consider throughput requirements for batch processing

3. Price Considerations:
   - Provide realistic price ranges in CNY
   - Consider both new and slightly used market prices
   - Factor in the current GPU market conditions

4. Multi-GPU Setups:
   - Recommend multiple GPUs if needed for large models
   - Consider distributed training requirements
   - Account for communication overhead

5. Preferred GPU Handling:
   - When a preferred GPU is specified, analyze its suitability first
   - Only suggest alternatives if the preferred GPU is clearly insufficient
   - Calculate how many of the preferred GPU would be needed
   - Provide detailed reasoning if the preferred GPU is not recommended

Your response must be a valid JSON object with these fields:
{
  "model": "string (GPU model name, must match the preferred GPU if specified and suitable)",
  "quantity": "number (number of GPUs needed)",
  "priceRange": "string (price range in CNY, formatted as '¥X,XXX - ¥X,XXX')",
  "reason": "string (detailed recommendation reasoning in Chinese, including analysis of preferred GPU if specified)",
  "estimatedVram": "string (required VRAM, formatted as 'XX GB')",
  "estimatedMemory": "string (required system memory, formatted as 'XX GB')",
  "alternativeModels": "string[] (array of alternative GPU model names, only include if preferred GPU is unsuitable)"
}`;

export async function getAIGpuRecommendation(params: ModelParams): Promise<GpuRecommendation> {
  if (!OPENROUTER_API_KEY) {
    return {
      ...getGpuRecommendation(params),
      isAIGenerated: false
    };
  }

  try {
    // 创建一个 Promise 竞争，一个是 AI 推荐，一个是 3 秒超时
    const timeoutPromise = new Promise<GpuRecommendation>((_, reject) => {
      setTimeout(() => {
        reject(new Error('AI recommendation timeout'));
      }, 3000);
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
- Use case: ${params.mode}

Please analyze the requirements and provide:
1. Whether the requested ${params.preferredGpu} is suitable for these requirements
2. How many of these GPUs would be needed
3. If multiple GPUs are needed, explain why
4. Estimated VRAM and system memory requirements
5. Alternative GPU models only if ${params.preferredGpu} is determined to be unsuitable
   
Your response should prioritize using ${params.preferredGpu} unless it is clearly insufficient for the requirements.`
        : `Based on these parameters:
- Model name: ${params.modelName}
- Model size: ${params.modelSize} parameters
- Batch size: ${params.batchSize}
- Precision: ${params.precision}
- Sequence length: ${params.sequenceLength}
- Training steps: ${params.trainingSteps}
- Distributed training: ${params.usesDistributedTraining ? 'Yes' : 'No'}
- Extra memory usage: ${params.memoryUsage} GB
- Use case: ${params.mode}

Please recommend suitable GPU specifications. Consider the following factors:
1. For training tasks, recommend GPUs with more VRAM and compute power
2. For inference tasks, focus on cost-effectiveness
3. If distributed training is enabled, consider recommending multiple GPUs
4. Consider the memory requirements for the given sequence length and batch size
5. Take into account the precision mode's impact on memory usage

Please provide a detailed recommendation in Chinese, including:
- The recommended GPU model
- Number of GPUs needed
- Price range in CNY
- Reasoning for the recommendation
- Estimated VRAM usage
- Estimated system memory requirement
- Alternative GPU models to consider`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'HTTP-Referer': 'https://github.com/deeperxh/gpu-recommender',
          'X-Title': 'GPU Recommender',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-opus',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`AI API responded with status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in AI response');
      }

      // 尝试解析 JSON 响应
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const recommendation = JSON.parse(jsonMatch[0]);
      if (!recommendation || !recommendation.model || !recommendation.quantity) {
        throw new Error('Invalid AI recommendation format');
      }

      return {
        ...recommendation,
        isAIGenerated: true
      };
    })();

    // 使用 Promise.race 实现超时处理
    return await Promise.race([aiPromise, timeoutPromise]);
  } catch (error) {
    console.error('AI recommendation failed:', error);
    // 超时或其他错误时，回退到规则推荐
    return {
      ...getGpuRecommendation(params),
      isAIGenerated: false
    };
  }
}
