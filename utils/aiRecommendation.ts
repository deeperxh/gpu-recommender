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
    console.warn('OpenRouter API key not found, falling back to rule-based recommendation');
    return getGpuRecommendation(params);
  }

  try {
    // 如果用户指定了首选 GPU，调整提示以强制使用该 GPU
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
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://gpu-recommender.vercel.app',
        'X-Title': 'GPU Recommender'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`API Error: ${errorData?.message || response.statusText}`);
    }

    const result = await response.json();
    console.log('API Response:', result);

    if (!result || !result.choices || !result.choices.length) {
      console.error('Invalid API response format:', result);
      throw new Error('Invalid API response format: missing choices');
    }

    const content = result.choices[0].message?.content;
    if (!content) {
      console.error('Missing content in API response:', result.choices[0]);
      throw new Error('Invalid API response format: missing content');
    }

    // 移除可能的 Markdown 代码块标记
    const jsonContent = content.replace(/```json\n?|\n?```/g, '').trim();
    console.log('Cleaned JSON content:', jsonContent);

    let recommendation;
    try {
      recommendation = JSON.parse(jsonContent);
    } catch (error) {
      console.error('Failed to parse recommendation JSON:', content);
      throw new Error('Invalid JSON in API response');
    }

    // Validate the recommendation
    if (!recommendation || !recommendation.model || !recommendation.quantity) {
      throw new Error('Invalid AI recommendation format');
    }
    
    return {
      ...recommendation,
      isAIGenerated: true
    };
  } catch (error) {
    console.error('AI recommendation failed:', error);
    // Fallback to rule-based recommendation
    return {
      ...getGpuRecommendation(params),
      isAIGenerated: false
    };
  }
}
