import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useApp, useInput, useStdin } from 'ink';
import { Message, ConversationState } from '../types.js';
import Header from './Header.js';
import MessageList from './MessageList.js';
import InputArea from './InputArea.js';
import StatusLine from './StatusLine.js';
import { handleSlashCommand, getSlashCommands } from '../utils/commands.js';
import { generateId } from '../utils/helpers.js';
import { streamMessage } from '../utils/claude.js';

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

  // Check for API key from environment variable
  const envApiKey = process.env.ANTHROPIC_API_KEY || null;

  const [state, setState] = useState<ConversationState>({
    messages: [],
    isLoading: false,
    model: 'claude-3-sonnet',
    tokensUsed: 0,
    currentDirectory: process.cwd(),
    compactMode: false,
    apiKey: envApiKey,
  });

  const [inputValue, setInputValue] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const streamingMessageId = useRef<string | null>(null);

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

  const handleApiKeySubmit = (value: string) => {
    if (!value.trim()) return;
    setState(prev => ({ ...prev, apiKey: value.trim() }));
    setApiKeyInput('');
  };

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

    await streamMessage(messagesForApi, state.model, state.apiKey!, {
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

  // Show API key prompt if no key is set
  if (!state.apiKey) {
    return (
      <Box flexDirection="column" width="100%">
        <Header />
        <Box marginY={1} flexDirection="column">
          <Text color="yellow">╭─────────────────────────────────────────────────────────────╮</Text>
          <Text color="yellow">│                                                             │</Text>
          <Text color="yellow">│   Welcome to Claude Terminal Clone                          │</Text>
          <Text color="yellow">│                                                             │</Text>
          <Text color="yellow">│   Please enter your Anthropic API key to continue.         │</Text>
          <Text color="yellow">│   Get your key at: https://console.anthropic.com           │</Text>
          <Text color="yellow">│                                                             │</Text>
          <Text color="yellow">╰─────────────────────────────────────────────────────────────╯</Text>
        </Box>
        <Box>
          <Text color="green">API Key: </Text>
          <InputArea
            value={apiKeyInput}
            onChange={setApiKeyInput}
            onSubmit={handleApiKeySubmit}
            isLoading={false}
            placeholder="sk-ant-..."
          />
        </Box>
      </Box>
    );
  }

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
