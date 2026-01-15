import React from 'react';
import { Box, Text } from 'ink';
import { Message } from '../types.js';
import MessageItem from './MessageItem.js';
import Spinner from './Spinner.js';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  if (messages.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Box flexDirection="column" marginY={1}>
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}

      {isLoading && (
        <Box marginY={1}>
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
