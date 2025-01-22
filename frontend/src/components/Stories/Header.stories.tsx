import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import Header from '../Header';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../styles/theme';

export default {
  title: 'Components/Header',
  component: Header,
} as Meta<typeof Header>;

const Template: StoryFn<typeof Header> = (args) => (
  <ThemeProvider theme={theme}>
    <Header {...args} />
  </ThemeProvider>
);

export const Default = Template.bind({});
Default.args = {};