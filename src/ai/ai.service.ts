import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
 private readonly client: OpenAI;
 readonly model: string;
 constructor(private config: ConfigService) {
  this.client = new OpenAI({ apiKey: config.getOrThrow<string>('OPENAI_API_KEY'), timeout: 60000, maxRetries: 2 });
  this.model = config.get<string>('OPENAI_MODEL', 'gpt-4.1-mini');
 }
 async generate(prompt: string, previousResponseId?: string) {
  const response = await this.client.responses.create({
    model: this.model, input: prompt, store: true,
    ...(previousResponseId ? { previous_response_id: previousResponseId } : {})
  });
  if (!response.output_text) throw new ServiceUnavailableException('Empty OpenAI response');
  return { text: response.output_text, responseId: response.id,
    inputTokens: response.usage?.input_tokens ?? null,
    outputTokens: response.usage?.output_tokens ?? null };
 }
}

