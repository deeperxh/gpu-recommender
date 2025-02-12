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

Your response must be a valid JSON object with these fields:
{
  "model": "string (GPU model name)",
  "quantity": "number (number of GPUs needed)",
  "priceRange": "string (price range in CNY, formatted as '¥X,XXX - ¥X,XXX')",
  "reason": "string (detailed recommendation reasoning in Chinese)",
  "estimatedVram": "string (required VRAM, formatted as 'XX GB')",
  "estimatedMemory": "string (required system memory, formatted as 'XX GB')",
  "alternativeModels": "string[] (array of alternative GPU model names)"
}`;

export async function getAIGpuRecommendation(params: ModelParams): Promise<GpuRecommendation> {
  if (!OPENROUTER_API_KEY) {
    console.warn('OpenRouter API key not found, falling back to rule-based recommendation');
    return getGpuRecommendation(params);
  }

  try {
    const userPrompt = `Based on these parameters:
- Model name: ${params.modelName}
- Model size: ${params.modelSize} parameters
- Batch size: ${params.batchSize}
- Precision: ${params.precision}
- Sequence length: ${params.sequenceLength}
- Training steps: ${params.trainingSteps}
- Distributed training: ${params.usesDistributedTraining ? 'Yes' : 'No'}
- Extra memory usage: ${params.memoryUsage} GB
- Use case: ${params.mode}
- Preferred GPU: ${params.preferredGpu || 'Not specified'}

Please recommend suitable GPU specifications. Consider the following factors:
1. For training tasks, recommend GPUs with more VRAM and compute power
2. For inference tasks, focus on cost-effectiveness
3. If distributed training is enabled, consider recommending multiple GPUs
4. Consider the memory requirements for the given sequence length and batch size
5. Take into account the precision mode's impact on memory usage
6. If a preferred GPU is specified, include it in the alternatives if not chosen as the main recommendation

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
    
    return recommendation;
  } catch (error) {
    console.error('AI recommendation failed:', error);
    // Fallback to rule-based recommendation
    return getGpuRecommendation(params);
  }
}
