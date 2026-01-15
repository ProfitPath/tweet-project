import React from 'react';
import { Box, Text } from 'ink';
import { Message } from '../types.js';
import MessageItem from './MessageItem.js';
import Spinner from './Spinner.js';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  compactMode: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, compactMode }) => {
  if (messages.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Box flexDirection="column" marginY={compactMode ? 0 : 1}>
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} compactMode={compactMode} />
      ))}

      {isLoading && (
        <Box marginY={compactMode ? 0 : 1}>
          <Spinner />
          <Text color="gray" dimColor>
            {' '}Thinking...
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default MessageList;
