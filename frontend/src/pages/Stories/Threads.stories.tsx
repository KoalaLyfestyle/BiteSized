import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import Threads from '../Threads';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../styles/theme';

export default {
  title: 'Pages/Threads',
  component: Threads,
} as Meta<typeof Threads>;

const Template: StoryFn<typeof Threads> = (args: any) => (
  <ThemeProvider theme={theme}>
    <Threads {...args} />
  </ThemeProvider>
);

export const Default = Template.bind({});
Default.args = {};
