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
