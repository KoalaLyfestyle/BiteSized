import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import Home from '../Home';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../styles/theme';
import { Item, Recipe, Thread, isRecipe } from '../../types/types';


export default {
  title: 'Pages/Home',
  component: Home,
} as Meta<typeof Home>;

const Template: StoryFn<typeof Home> = (args: any) => (
  <ThemeProvider theme={theme}>
    <Home {...args} />
  </ThemeProvider>
);

export const Default = Template.bind({});
Default.args = {};
