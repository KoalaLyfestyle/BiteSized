import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import ThreadCard from '../ThreadCard';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../styles/theme';

export default {
  title: 'Components/ThreadCard',
  component: ThreadCard,
} as Meta<typeof ThreadCard>;

const Template: StoryFn<typeof ThreadCard> = (args) => (
  <ThemeProvider theme={theme}>
    <ThreadCard {...args} />
  </ThemeProvider>
);

export const Default = Template.bind({});
Default.args = {
  id: 1,
  title: "Sample Thread Title",
  content: "This is a sample content for the thread.",
  userId: 123,
  createdAt: new Date().toISOString(),
};
