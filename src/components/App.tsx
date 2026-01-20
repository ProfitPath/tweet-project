import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useApp, useInput, useStdin } from 'ink';
import { Message, ConversationState } from '../types.js';
import Header from './Header.js';
import MessageList from './MessageList.js';
import InputArea from './InputArea.js';
import StatusLine from './StatusLine.js';
import { handleSlashCommand, getSlashCommands } from '../utils/commands.js';
import { generateId } from '../utils/helpers.js';
import { streamMessage, isApiKeyConfigured } from '../utils/claude.js';

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

const NO_API_KEY_MESSAGE = `⚠️  No API key found. Set your ANTHROPIC_API_KEY environment variable:

   export ANTHROPIC_API_KEY="your-api-key-here"

   Then restart the terminal.`;

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
  const [streamingContent, setStreamingContent] = useState('');
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const streamingMessageId = useRef<string | null>(null);

  // Check for API key on mount
  useEffect(() => {
    if (!isApiKeyConfigured()) {
      setApiKeyMissing(true);
    }
  }, []);

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

    // Check if API key is configured
    if (apiKeyMissing) {
      const errorMessage: Message = {
        id: generateId(),
        role: 'system',
        content: NO_API_KEY_MESSAGE,
        timestamp: new Date(),
      };
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
      }));
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: value,
      timestamp: new Date(),
    };

    // Create placeholder for assistant message
    const assistantMessageId = generateId();
    streamingMessageId.current = assistantMessageId;

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    setStreamingContent('');

    // Call the real Claude API with streaming
    const messagesForApi = [...state.messages, userMessage];

    await streamMessage(messagesForApi, state.model, {
      onText: (text) => {
        setStreamingContent(prev => prev + text);
      },
      onComplete: (fullText, usage) => {
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: fullText,
          timestamp: new Date(),
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
          tokensUsed: prev.tokensUsed + usage.inputTokens + usage.outputTokens,
        }));

        setStreamingContent('');
        streamingMessageId.current = null;
      },
      onError: (error) => {
        const errorMessage: Message = {
          id: generateId(),
          role: 'system',
          content: `Error: ${error.message}`,
          timestamp: new Date(),
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
          isLoading: false,
        }));

        setStreamingContent('');
        streamingMessageId.current = null;
      },
    });
  };

  return (
    <Box flexDirection="column" width="100%">
      <Header />

      {showWelcome && state.messages.length === 0 && (
        <Box marginY={1}>
          <Text color="cyan">{WELCOME_MESSAGE}</Text>
        </Box>
      )}

      <MessageList
        messages={state.messages}
        isLoading={state.isLoading}
        compactMode={state.compactMode}
        streamingContent={streamingContent}
      />

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

export default App;
