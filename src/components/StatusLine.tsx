import React from 'react';
import { Box, Text } from 'ink';
import { ConversationState } from '../types.js';

interface StatusLineProps {
  state: ConversationState;
}

const StatusLine: React.FC<StatusLineProps> = ({ state }) => {
  const messageCount = state.messages.length;
  const userMessages = state.messages.filter((m) => m.role === 'user').length;
  const assistantMessages = state.messages.filter((m) => m.role === 'assistant').length;

  return (
    <Box marginTop={1} justifyContent="space-between">
      <Box>
        <Text color="gray" dimColor>
          Model:{' '}
        </Text>
        <Text color="cyan">{state.model}</Text>

        <Text color="gray" dimColor>
          {' │ '}
        </Text>

        <Text color="gray" dimColor>
          Messages:{' '}
        </Text>
        <Text color="white">{messageCount}</Text>
        <Text color="gray" dimColor>
          {' ('}
        </Text>
        <Text color="green">{userMessages}↑</Text>
        <Text color="gray" dimColor>
          {' '}
        </Text>
        <Text color="blue">{assistantMessages}↓</Text>
        <Text color="gray" dimColor>
          {')'}
        </Text>

        <Text color="gray" dimColor>
          {' │ '}
        </Text>

        <Text color="gray" dimColor>
          Tokens:{' '}
        </Text>
        <Text color="yellow">{state.tokensUsed.toLocaleString()}</Text>
      </Box>

      <Box>
        <Text color="gray" dimColor>
          {truncatePath(state.currentDirectory, 30)}
        </Text>
      </Box>
    </Box>
  );
};

function truncatePath(path: string, maxLength: number): string {
  if (path.length <= maxLength) return path;

  const parts = path.split('/');
  let result = parts[parts.length - 1];

  for (let i = parts.length - 2; i >= 0; i--) {
    const newResult = `${parts[i]}/${result}`;
    if (newResult.length > maxLength - 3) {
      return `.../${result}`;
    }
    result = newResult;
  }

  return result;
}

export default StatusLine;
