import React from "react";
import { StoryFn, Meta } from "@storybook/react";
import PostRecipe from "../PostRecipe";
import { ThemeProvider } from "@emotion/react";
import theme from '../../styles/theme';

export default {
  title: "Pages/PostRecipe",
  component: PostRecipe,
} as Meta<typeof PostRecipe>;

const Template: StoryFn<typeof PostRecipe> = (args: any) => (
  <ThemeProvider theme={theme}>
    <PostRecipe {...args} />
  </ThemeProvider>
);

export const Default = Template.bind({});
Default.args = {};