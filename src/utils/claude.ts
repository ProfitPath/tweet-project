import Anthropic from '@anthropic-ai/sdk';
import { Message } from '../types.js';

// Initialize the Anthropic client
// It automatically uses ANTHROPIC_API_KEY environment variable
const anthropic = new Anthropic();

export interface StreamCallbacks {
  onText: (text: string) => void;
  onComplete: (fullText: string, usage: { inputTokens: number; outputTokens: number }) => void;
  onError: (error: Error) => void;
}

// Map our message format to Anthropic's format
function toAnthropicMessages(messages: Message[]): Anthropic.MessageParam[] {
  return messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
}

// Get the model ID from our simplified model names
function getModelId(model: string): string {
  const modelMap: Record<string, string> = {
    'claude-3-opus': 'claude-sonnet-4-20250514',
    'claude-3-sonnet': 'claude-sonnet-4-20250514',
    'claude-3-haiku': 'claude-haiku-3-5-20241022',
    'claude-sonnet': 'claude-sonnet-4-20250514',
    'claude-haiku': 'claude-haiku-3-5-20241022',
  };
  return modelMap[model] || 'claude-sonnet-4-20250514';
}

// Send a message and stream the response
export async function streamMessage(
  messages: Message[],
  model: string,
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    const anthropicMessages = toAnthropicMessages(messages);

    if (anthropicMessages.length === 0) {
      callbacks.onError(new Error('No valid messages to send'));
      return;
    }

    let fullText = '';

    const stream = anthropic.messages.stream({
      model: getModelId(model),
      max_tokens: 4096,
      messages: anthropicMessages,
    });

    stream.on('text', (text) => {
      fullText += text;
      callbacks.onText(text);
    });

    const finalMessage = await stream.finalMessage();

    callbacks.onComplete(fullText, {
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
    });
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

// Non-streaming version for simpler use cases
export async function sendMessage(
  messages: Message[],
  model: string
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const anthropicMessages = toAnthropicMessages(messages);

  if (anthropicMessages.length === 0) {
    throw new Error('No valid messages to send');
  }

  const response = await anthropic.messages.create({
    model: getModelId(model),
    max_tokens: 4096,
    messages: anthropicMessages,
  });

  const textContent = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');

  return {
    content: textContent,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

// Check if API key is configured
export function isApiKeyConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
