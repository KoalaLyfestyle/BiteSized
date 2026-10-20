import fs from 'fs';
import path from 'path';
import { monogram } from './components/RecipeArt';
import { cssVariables, palette } from './styles/tokens';

const publicDir = path.join(__dirname, '..', 'public');

test('the page title, description, and manifest name BiteSized, not the CRA template', () => {
  const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  expect(html).toMatch(/<title>BiteSized/);
  expect(html).not.toMatch(/React App|create-react-app/);
  expect(html).toMatch(/property="og:image"/);

  const manifest = JSON.parse(fs.readFileSync(path.join(publicDir, 'manifest.json'), 'utf8'));
  expect(manifest.short_name).toBe('BiteSized');
  // Every icon the manifest names exists.
  for (const icon of manifest.icons) {
    expect(fs.existsSync(path.join(publicDir, icon.src))).toBe(true);
  }
});

test('the palette is exposed as CSS variables', () => {
  const vars = cssVariables();
  expect(vars['--bs-crust']).toBe(palette.crust);
  expect(vars['--bs-crust-dark']).toBe(palette.crustDark);
  expect(vars['--bs-font-display']).toMatch(/Fraunces/);
});

test('recipe art uses the first letter of the title, skipping a [Sample] tag', () => {
  expect(monogram('[Sample] Overnight oats')).toBe('O');
  expect(monogram('garlic fried rice')).toBe('G');
  expect(monogram('🍳 Eggs')).toBe('🍳');
  expect(monogram('')).toBe('?');
});

// WCAG 2 contrast ratio between two #RRGGBB colours.
function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test.each([
  ['body text on the page', palette.chocolate, palette.cream],
  ['secondary text on the page', palette.cocoa, palette.cream],
  ['secondary text on cards', palette.cocoa, palette.paper],
  ['links and the brand colour on the page', palette.crust, palette.cream],
  ['white on primary buttons and step numbers', '#FFFFFF', palette.crust],
  ['white on the Add recipe button', '#FFFFFF', palette.tomato],
  ['the tomato overline on the page', palette.tomato, palette.cream],
  ['tag chip text', palette.herb, palette.herbSoft],
])('%s meets WCAG AA (4.5:1)', (_, fg, bg) => {
  expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
});
