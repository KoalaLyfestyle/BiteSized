import React from "react";
import type { Preview } from "@storybook/react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/inter";
import "../src/index.css";
import theme from "../src/styles/theme";
import { cssVariables } from "../src/styles/tokens";

// Give every story the app's theme, fonts, and --bs-* variables.
const preview: Preview = {
  decorators: [
    (Story) =>
      React.createElement(
        ThemeProvider,
        { theme },
        React.createElement(CssBaseline),
        React.createElement(GlobalStyles, { styles: { ":root": cssVariables() } }),
        React.createElement(Story),
      ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
