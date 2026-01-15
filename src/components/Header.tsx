import React from 'react';
import { Box, Text } from 'ink';

const Header: React.FC = () => {
  return (
    <Box
      borderStyle="single"
      borderColor="blue"
      paddingX={2}
      marginBottom={1}
    >
      <Text bold color="blue">
        ◆ Claude Terminal Clone
      </Text>
      <Text color="gray"> │ </Text>
      <Text color="gray">Type /help for commands</Text>
    </Box>
  );
};

export default Header;
