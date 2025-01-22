import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import RecipeCard from '../RecipeCard';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../styles/theme';

export default {
  title: 'Components/RecipeCard',
  component: RecipeCard,
} as Meta<typeof RecipeCard>;

const Template: StoryFn<typeof RecipeCard> = (args) => (
  <ThemeProvider theme={theme}>
    <RecipeCard {...args} />
  </ThemeProvider>
);

export const Default = Template.bind({});
Default.args = {
  id: 1,
  title: "Sample Recipe Title",
  content: "This is a sample content for the recipe.",
  ingredients: "Sample ingredients",
  steps: "Sample steps",
  userId: 123,
  createdAt: new Date().toISOString(),
};
