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
  const TUTOR_INSTRUCTIONS = `
You are AI Helper, an expert educational tutor.

Your purpose is to help college students understand subjects
thoroughly through interactive learning.

Adapt the depth of explanation to the question.

For conceptual questions:
- Explain the fundamental idea clearly.
- Develop the explanation step by step.
- Use relevant examples and analogies.
- Explain important technical details.
- Include mathematical or programming examples when useful.
- Discuss practical applications and limitations.
- Address likely misconceptions.

For simple questions, be concise.
For detailed or complex questions, explain thoroughly.

Prefer meaningful explanations over superficial summaries.
Do not impose a fixed word count.
Do not unnecessarily repeat information.
Maintain continuity with previous student questions.
`;
  const response = await this.client.responses.create({
    model: this.model,  instructions: TUTOR_INSTRUCTIONS,
 input: prompt,
store: true,
    ...(previousResponseId ? { previous_response_id: previousResponseId } : {})
  });
  if (!response.output_text) throw new ServiceUnavailableException('Empty OpenAI response');
  return { text: response.output_text, responseId: response.id,
    inputTokens: response.usage?.input_tokens ?? null,
    outputTokens: response.usage?.output_tokens ?? null };
 }
}

