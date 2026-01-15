import { ConversationState, SlashCommand, Message } from '../types.js';
import { generateId } from './helpers.js';

const commands: SlashCommand[] = [
  {
    name: 'help',
    description: 'Show available commands and keyboard shortcuts',
    handler: (args, state) => {
      const helpMessage: Message = {
        id: generateId(),
        role: 'system',
        content: `**Available Commands:**

  /help          Show this help message
  /clear         Clear the conversation history
  /exit          Exit the terminal
  /compact       Toggle compact message display
  /model         Show or change the current model
  /cost          Show token usage and estimated cost
  /history       Show conversation history summary

**Keyboard Shortcuts:**

  Ctrl+C         Exit the terminal
  Ctrl+L         Clear the screen
  ↑/↓            Navigate command history
  Enter          Submit message

**Tips:**

  • Type your message and press Enter to send
  • Use markdown in your messages for formatting
  • Code blocks are syntax highlighted`,
        timestamp: new Date(),
      };

      return {
        ...state,
        messages: [...state.messages, helpMessage],
      };
    },
  },
  {
    name: 'clear',
    description: 'Clear the conversation history',
    handler: (args, state) => {
      return {
        ...state,
        messages: [],
        tokensUsed: 0,
      };
    },
  },
  {
    name: 'exit',
    description: 'Exit the terminal',
    handler: () => null, // Special case: handled in App.tsx
  },
  {
    name: 'compact',
    description: 'Toggle compact message display mode',
    handler: (args, state) => {
      const newCompactMode = !state.compactMode;
      const systemMessage: Message = {
        id: generateId(),
        role: 'system',
        content: `Compact mode ${newCompactMode ? 'enabled' : 'disabled'}.`,
        timestamp: new Date(),
      };

      return {
        ...state,
        compactMode: newCompactMode,
        messages: [...state.messages, systemMessage],
      };
    },
  },
  {
    name: 'model',
    description: 'Show or change the current model',
    handler: (args, state) => {
      const newModel = args[0];
      const validModels = ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'];

      if (newModel && validModels.includes(newModel)) {
        const systemMessage: Message = {
          id: generateId(),
          role: 'system',
          content: `Model changed to: **${newModel}**`,
          timestamp: new Date(),
        };

        return {
          ...state,
          model: newModel,
          messages: [...state.messages, systemMessage],
        };
      }

      const systemMessage: Message = {
        id: generateId(),
        role: 'system',
        content: `Current model: **${state.model}**

Available models:
  • claude-3-opus
  • claude-3-sonnet
  • claude-3-haiku

Usage: /model <model-name>`,
        timestamp: new Date(),
      };

      return {
        ...state,
        messages: [...state.messages, systemMessage],
      };
    },
  },
  {
    name: 'cost',
    description: 'Show token usage and estimated cost',
    handler: (args, state) => {
      // Rough cost estimation (example rates)
      const inputCostPer1K = 0.015;
      const outputCostPer1K = 0.075;
      const estimatedCost = (state.tokensUsed / 1000) * ((inputCostPer1K + outputCostPer1K) / 2);

      const systemMessage: Message = {
        id: generateId(),
        role: 'system',
        content: `**Token Usage Summary:**

  Total tokens used: ${state.tokensUsed.toLocaleString()}
  Estimated cost: $${estimatedCost.toFixed(4)}

  Messages in conversation: ${state.messages.length}
  User messages: ${state.messages.filter(m => m.role === 'user').length}
  Assistant messages: ${state.messages.filter(m => m.role === 'assistant').length}`,
        timestamp: new Date(),
      };

      return {
        ...state,
        messages: [...state.messages, systemMessage],
      };
    },
  },
  {
    name: 'history',
    description: 'Show conversation history summary',
    handler: (args, state) => {
      const userMessages = state.messages.filter(m => m.role === 'user');
      const summary = userMessages.length > 0
        ? userMessages.map((m, i) => `  ${i + 1}. ${m.content.slice(0, 50)}${m.content.length > 50 ? '...' : ''}`).join('\n')
        : '  (No messages yet)';

      const systemMessage: Message = {
        id: generateId(),
        role: 'system',
        content: `**Conversation History:**

${summary}

Total messages: ${state.messages.length}`,
        timestamp: new Date(),
      };

      return {
        ...state,
        messages: [...state.messages, systemMessage],
      };
    },
  },
];

export function handleSlashCommand(
  input: string,
  state: ConversationState,
  exitFn: () => void
): ConversationState | null {
  const parts = input.slice(1).trim().split(/\s+/);
  const commandName = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Special case for exit
  if (commandName === 'exit' || commandName === 'quit' || commandName === 'q') {
    exitFn();
    return null;
  }

  const command = commands.find(c => c.name === commandName);

  if (!command) {
    const errorMessage: Message = {
      id: generateId(),
      role: 'system',
      content: `Unknown command: **/${commandName}**

Type /help for available commands.`,
      timestamp: new Date(),
    };

    return {
      ...state,
      messages: [...state.messages, errorMessage],
    };
  }

  return command.handler(args, state);
}

export function getSlashCommands(): SlashCommand[] {
  return commands;
}
