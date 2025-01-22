import React from "react";
import { StoryFn, Meta } from "@storybook/react";
import PostThread from "../PostThread";
import { ThemeProvider } from "@emotion/react";
import theme from '../../styles/theme';

export default {
  title: "Pages/PostThread",
  component: PostThread,
} as Meta<typeof PostThread>;

const Template: StoryFn<typeof PostThread> = (args: any) => (
  <ThemeProvider theme={theme}>
    <PostThread {...args} />
  </ThemeProvider>
);

export const Default = Template.bind({});
Default.args = {};