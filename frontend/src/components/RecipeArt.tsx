import React from 'react';
import { Box } from '@mui/material';
import { palette } from '../styles/tokens';

// Recipes have no photos yet. Until they do, each recipe gets a warm, stable
// illustration made from its title, so the grid never looks empty. Pass
// imageUrl to show a real photo in the same slot.

const BACKDROPS: [string, string][] = [
  ['#F4D9B8', '#E8B98A'], // dough
  ['#F6CDBB', '#E39A7E'], // tomato
  ['#DCE6CF', '#AFC39A'], // herb
  ['#F3E2B3', '#E2BF6C'], // honey
  ['#E9D6C9', '#C9A28A'], // cocoa
];

/** The first letter of the title, skipping a leading tag such as "[Sample]". */
export function monogram(title: string): string {
  const clean = title.replace(/^\s*\[[^\]]*\]\s*/, '').trim();
  const first = Array.from(clean)[0];
  return first ? first.toUpperCase() : '?';
}

interface RecipeArtProps {
  id: number;
  title: string;
  imageUrl?: string;
  height: number | Record<string, number>;
  rounded?: boolean;
}

const RecipeArt: React.FC<RecipeArtProps> = ({ id, title, imageUrl, height, rounded = false }) => {
  const [from, to] = BACKDROPS[Math.abs(id) % BACKDROPS.length];
  return (
    <Box
      sx={{
        position: 'relative',
        height,
        overflow: 'hidden',
        borderRadius: rounded ? 'var(--bs-radius-lg)' : 0,
        background: `radial-gradient(circle at 20% 15%, rgba(255,255,255,0.55) 0 18%, transparent 19%),
          radial-gradient(circle at 85% 80%, rgba(255,255,255,0.35) 0 12%, transparent 13%),
          linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {imageUrl ? (
        <Box
          component="img"
          src={imageUrl}
          alt=""
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <Box
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--bs-font-display)',
            fontWeight: 700,
            fontSize: typeof height === 'number' ? height * 0.55 : 96,
            lineHeight: 1,
            color: 'rgba(59, 36, 22, 0.18)',
            userSelect: 'none',
          }}
        >
          {monogram(title)}
        </Box>
      )}
      <Box
        aria-hidden="true"
        sx={{ position: 'absolute', inset: 'auto 0 0 0', height: 4, bgcolor: palette.crust, opacity: 0.25 }}
      />
    </Box>
  );
};

export default RecipeArt;
