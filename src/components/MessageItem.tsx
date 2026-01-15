import React from 'react';
import { Box, Text } from 'ink';
import { Message } from '../types.js';
import { formatMarkdown } from '../utils/markdown.js';

interface MessageItemProps {
  message: Message;
}

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const getRoleIndicator = () => {
    if (isUser) return { symbol: '❯', color: 'green' as const };
    if (isSystem) return { symbol: '●', color: 'yellow' as const };
    return { symbol: '◆', color: 'blue' as const };
  };

  const { symbol, color } = getRoleIndicator();

  return (
    <Box flexDirection="column" marginY={1}>
      <Box>
        <Text color={color} bold>
          {symbol}
        </Text>
        <Text color={color} bold>
          {' '}
          {isUser ? 'You' : isSystem ? 'System' : 'Claude'}
        </Text>
        <Text color="gray" dimColor>
          {' '}
          {formatTime(message.timestamp)}
        </Text>
      </Box>

      <Box marginLeft={2} marginTop={0}>
        <Text wrap="wrap">{formatMarkdown(message.content)}</Text>
      </Box>

      {message.toolCalls && message.toolCalls.length > 0 && (
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          {message.toolCalls.map((tool, index) => (
            <Box key={index}>
              <Text color="magenta">⚙ {tool.name}</Text>
              <Text color="gray"> - </Text>
              <Text
                color={
                  tool.status === 'completed'
                    ? 'green'
                    : tool.status === 'failed'
                    ? 'red'
                    : 'yellow'
                }
              >
                {tool.status}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default MessageItem;
