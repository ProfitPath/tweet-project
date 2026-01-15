import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput, useStdin } from 'ink';
import { Message, ConversationState } from '../types.js';
import Header from './Header.js';
import MessageList from './MessageList.js';
import InputArea from './InputArea.js';
import StatusLine from './StatusLine.js';
import { handleSlashCommand, getSlashCommands } from '../utils/commands.js';
import { generateId } from '../utils/helpers.js';

const WELCOME_MESSAGE = `╭─────────────────────────────────────────────────────────────╮
│                                                             │
│   Claude Terminal Clone                                     │
│   A basic replica of the Claude Code CLI interface          │
│                                                             │
│   Type a message to chat, or use slash commands:            │
│   /help - Show available commands                           │
│   /clear - Clear conversation                               │
│   /exit - Exit the terminal                                 │
│                                                             │
╰─────────────────────────────────────────────────────────────╯`;

const App: React.FC = () => {
  const { exit } = useApp();
  const { isRawModeSupported } = useStdin();

  const [state, setState] = useState<ConversationState>({
    messages: [],
    isLoading: false,
    model: 'claude-3-opus',
    tokensUsed: 0,
    currentDirectory: process.cwd(),
    compactMode: false,
  });

  const [inputValue, setInputValue] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [inputHistory, setInputHistory] = useState<string[]>([]);

  // Handle keyboard shortcuts
  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
    if (key.ctrl && input === 'l') {
      setState(prev => ({ ...prev, messages: [] }));
      setShowWelcome(false);
    }
    // Arrow up for history navigation
    if (key.upArrow && inputHistory.length > 0) {
      const newIndex = Math.min(historyIndex + 1, inputHistory.length - 1);
      setHistoryIndex(newIndex);
      setInputValue(inputHistory[inputHistory.length - 1 - newIndex] || '');
    }
    // Arrow down for history navigation
    if (key.downArrow && historyIndex > -1) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (newIndex < 0) {
        setInputValue('');
      } else {
        setInputValue(inputHistory[inputHistory.length - 1 - newIndex] || '');
      }
    }
  });

  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;

    setShowWelcome(false);
    setInputHistory(prev => [...prev, value]);
    setHistoryIndex(-1);
    setInputValue('');

    // Check for slash command
    if (value.startsWith('/')) {
      const result = handleSlashCommand(value, state, exit);
      if (result) {
        setState(result);
      }
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: value,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    // Simulate assistant response (in a real implementation, this would call the Claude API)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: getSimulatedResponse(value),
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
        tokensUsed: prev.tokensUsed + Math.floor(Math.random() * 500) + 100,
      }));
    }, 1000);
  };

  return (
    <Box flexDirection="column" width="100%">
      <Header />

      {showWelcome && state.messages.length === 0 && (
        <Box marginY={1}>
          <Text color="cyan">{WELCOME_MESSAGE}</Text>
        </Box>
      )}

      <MessageList messages={state.messages} isLoading={state.isLoading} compactMode={state.compactMode} />

      <InputArea
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        isLoading={state.isLoading}
      />

      <StatusLine state={state} />
    </Box>
  );
};

function getSimulatedResponse(input: string): string {
  // Simulated responses for demo purposes
  const responses = [
    "I understand your request. In a full implementation, I would process this through the Claude API and provide a meaningful response based on your input.",
    "This is a simulated response. The actual Claude terminal would connect to Anthropic's API to generate real responses.",
    "To make this a fully functional clone, you would need to integrate the Anthropic SDK and handle API authentication.",
  ];

  if (input.toLowerCase().includes('help')) {
    return `Here are the available commands:\n\n${getSlashCommands().map(cmd => `  **/${cmd.name}** - ${cmd.description}`).join('\n')}`;
  }

  return responses[Math.floor(Math.random() * responses.length)];
}

export default App;
