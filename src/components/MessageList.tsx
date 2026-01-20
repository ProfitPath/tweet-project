import React from 'react';
import { Box, Text } from 'ink';
import { Message } from '../types.js';
import MessageItem from './MessageItem.js';
import Spinner from './Spinner.js';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  compactMode: boolean;
  streamingContent?: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, compactMode, streamingContent }) => {
  if (messages.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Box flexDirection="column" marginY={compactMode ? 0 : 1}>
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} compactMode={compactMode} />
      ))}

      {isLoading && (
        <Box flexDirection="column" marginY={compactMode ? 0 : 1}>
          <Box>
            <Text color="blue" bold>◆ Claude</Text>
            {!streamingContent && (
              <>
                <Text> </Text>
                <Spinner />
                <Text color="gray" dimColor> Thinking...</Text>
              </>
            )}
          </Box>
          {streamingContent && (
            <Box marginLeft={2}>
              <Text wrap="wrap">{streamingContent}</Text>
              <Text color="gray">▌</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default MessageList;
