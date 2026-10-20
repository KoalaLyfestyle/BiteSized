import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Link, Skeleton, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import RecipeArt from '../components/RecipeArt';
import { plural } from '../components/RecipeCard';
import { ApiError, ApiRecipe, getRecipe, splitLines } from '../services/recipes';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string; notFound: boolean }
  | { status: 'ready'; recipe: ApiRecipe };

const RecipeDetail = ({ id }: { id: number }) => {
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback(
    (isActive: () => boolean = () => true) => {
      setState({ status: 'loading' });
      getRecipe(id)
        .then((recipe) => isActive() && setState({ status: 'ready', recipe }))
        .catch(
          (err: Error) =>
            isActive() &&
            setState({ status: 'error', message: err.message, notFound: err instanceof ApiError && err.status === 404 }),
        );
    },
    [id],
  );

  useEffect(() => {
    let active = true;
    load(() => active);
    // Ignore a late reply after leaving the page or switching recipes.
    return () => {
      active = false;
    };
  }, [load]);

  let body: React.ReactNode;
  if (state.status === 'loading') {
    body = (
      <Box role="status" aria-label="Loading recipe">
        <Skeleton variant="rounded" height={220} animation="wave" sx={{ borderRadius: 'var(--bs-radius-lg)' }} />
        <Skeleton width="60%" height={52} sx={{ mt: 3 }} />
        <Skeleton width="35%" />
        <Skeleton width="85%" sx={{ mt: 2 }} />
      </Box>
    );
  } else if (state.status === 'error') {
    body = state.notFound ? (
      <Alert severity="info">This recipe does not exist.</Alert>
    ) : (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => load()}>
            Retry
          </Button>
        }
      >
        Could not load the recipe: {state.message}
      </Alert>
    );
  } else {
    const r = state.recipe;
    const ingredients = splitLines(r.ingredients);
    const steps = splitLines(r.steps);
    body = (
      <article>
        <RecipeArt id={r.id} title={r.title} height={{ xs: 160, sm: 240 }} rounded />
        <Box sx={{ mt: 3, mb: 4 }}>
          {r.tags.length > 0 && (
            <Box data-testid="recipe-tags" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
              {r.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" color="success" />
              ))}
            </Box>
          )}
          <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 32, sm: 42 }, lineHeight: 1.1 }}>
            {r.title}
          </Typography>
          {r.content && (
            <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: 18, maxWidth: 640 }}>
              {r.content}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            {plural(ingredients.length, 'ingredient')} · {plural(steps.length, 'step')} · Posted by User {r.user_id} on{' '}
            {new Date(r.created_at).toLocaleDateString()}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(240px, 1fr) 2fr' },
            gap: { xs: 3, md: 5 },
            alignItems: 'start',
          }}
        >
          <Box
            component="section"
            aria-labelledby="ingredients-heading"
            sx={{
              p: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 'var(--bs-radius-md)',
              position: { md: 'sticky' },
              top: { md: 92 },
            }}
          >
            <Typography id="ingredients-heading" variant="h6" component="h2" sx={{ mb: 1 }}>
              Ingredients
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
              {ingredients.map((line, i) => (
                <Box
                  component="li"
                  key={i}
                  sx={{
                    py: 1,
                    borderTop: i === 0 ? 'none' : '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    gap: 1.25,
                    alignItems: 'baseline',
                  }}
                >
                  <Box
                    aria-hidden="true"
                    sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0, mt: '2px' }}
                  />
                  {line}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="section" aria-labelledby="steps-heading">
            <Typography id="steps-heading" variant="h6" component="h2" sx={{ mb: 1 }}>
              Steps
            </Typography>
            <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0, counterReset: 'step' }}>
              {steps.map((line, i) => (
                <Box
                  component="li"
                  key={i}
                  sx={{ display: 'flex', gap: 2, py: 1.5, alignItems: 'flex-start', fontSize: 17, lineHeight: 1.55 }}
                >
                  <Box
                    aria-hidden="true"
                    sx={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    {i + 1}
                  </Box>
                  <Box sx={{ pt: '3px' }}>{line}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </article>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 }, maxWidth: 1000, mx: 'auto' }}>
      <Link
        href="#/recipes"
        underline="hover"
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 2, fontWeight: 600 }}
      >
        <ArrowBackRoundedIcon fontSize="small" /> Back to recipes
      </Link>
      {body}
    </Box>
  );
};

export default RecipeDetail;
