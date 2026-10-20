// BiteSized design tokens. One source for the MUI theme and the CSS variables.
// The palette takes its colours from the cookie logo: baked dough, chocolate, and a
// warm tomato accent, with a herb green for tags. Every text colour meets WCAG AA
// (4.5:1) on the background it is used on; src/branding.test.ts checks this.

export const palette = {
  cream: '#FBF5EC', // page background
  paper: '#FFFDF9', // cards and panels
  dough: '#F1DFC4', // soft fills, image slots
  crust: '#9A5A2E', // primary brand colour; 5:1 on cream, and under white text
  crustDark: '#7A4420',
  chocolate: '#3B2416', // body text
  cocoa: '#6E5444', // secondary text
  tomato: '#B8432B', // calls to action; 5.4:1 under white text
  herb: '#4A6639', // tag text; 5.3:1 on herbSoft
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
