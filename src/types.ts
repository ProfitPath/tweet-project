export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
}

export interface ConversationState {
  messages: Message[];
  isLoading: boolean;
  model: string;
  tokensUsed: number;
  currentDirectory: string;
  compactMode: boolean;
  apiKey: string | null;
}

export interface SlashCommand {
  name: string;
  description: string;
  handler: (args: string[], state: ConversationState) => ConversationState | null;
}
