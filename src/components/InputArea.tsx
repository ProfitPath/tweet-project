import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const InputArea: React.FC<InputAreaProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder,
}) => {
  const [cursorVisible, setCursorVisible] = useState(true);

  // Blink cursor
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  useInput((input, key) => {
    if (isLoading) return;

    if (key.return) {
      onSubmit(value);
      return;
    }

    if (key.backspace || key.delete) {
      onChange(value.slice(0, -1));
      return;
    }

    // Ignore control characters
    if (key.ctrl || key.meta || key.escape) {
      return;
    }

    // Ignore arrow keys and other special keys
    if (key.upArrow || key.downArrow || key.leftArrow || key.rightArrow) {
      return;
    }

    // Add printable characters (supports paste with multiple chars)
    if (input && input.length > 0) {
      onChange(value + input);
    }
  });

  return (
    <Box
      borderStyle="round"
      borderColor={isLoading ? 'gray' : 'green'}
      paddingX={1}
      marginTop={1}
    >
      <Text color="green" bold>
        ❯{' '}
      </Text>
      <Text color={isLoading ? 'gray' : 'white'}>
        {value || (placeholder && <Text dimColor>{placeholder}</Text>)}
        {!isLoading && cursorVisible && <Text inverse> </Text>}
      </Text>
      {isLoading && (
        <Text color="gray" dimColor>
          {' '}
          (waiting...)
        </Text>
      )}
    </Box>
  );
};

export default InputArea;
