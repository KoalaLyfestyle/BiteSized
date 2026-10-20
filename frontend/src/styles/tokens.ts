// BiteSized design tokens. One source for the MUI theme and the CSS variables.
// The palette takes its colours from the cookie logo: baked dough, chocolate, and a
// warm tomato accent, with a herb green for tags.

export const palette = {
  cream: '#FBF5EC', // page background
  paper: '#FFFDF9', // cards and panels
  dough: '#F1DFC4', // soft fills, image slots
  crust: '#B86B3C', // primary brand colour
  crustDark: '#8E4E27',
  chocolate: '#3B2416', // body text
  cocoa: '#6E5444', // secondary text
  tomato: '#D4553A', // calls to action
  herb: '#5E7D4A', // tags
  herbSoft: '#E5ECDD',
  line: '#E8DCCB', // borders
} as const;

export const fonts = {
  display: '"Fraunces Variable", "Iowan Old Style", Georgia, serif',
  body: '"Inter Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
} as const;

/** Corner radii in px. Spacing uses the MUI unit (8px) throughout. */
export const radius = { sm: 8, md: 14, lg: 22 } as const;

/** The tokens as CSS custom properties, for plain CSS and inline styles. */
export function cssVariables(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [name, value] of Object.entries(palette)) {
    vars[`--bs-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`] = value;
  }
  vars['--bs-font-display'] = fonts.display;
  vars['--bs-font-body'] = fonts.body;
  for (const [name, value] of Object.entries(radius)) vars[`--bs-radius-${name}`] = `${value}px`;
  return vars;
}
