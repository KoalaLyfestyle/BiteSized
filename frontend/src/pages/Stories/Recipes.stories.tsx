import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import Recipes from '../Recipes';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../styles/theme';

export default {
  title: 'Pages/Recipes',
  component: Recipes,
} as Meta<typeof Recipes>;

const Template: StoryFn<typeof Recipes> = (args: any) => (
  <ThemeProvider theme={theme}>
    <Recipes {...args} />
  </ThemeProvider>
);

export const Default = Template.bind({});
Default.args = {};
