import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Link, Typography } from '@mui/material';
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
    body = <CircularProgress aria-label="Loading recipe" />;
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
    body = (
      <article>
        <Typography variant="h4" component="h1" gutterBottom>
          {r.title}
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Posted by User {r.user_id} on {new Date(r.created_at).toLocaleDateString()}
        </Typography>
        {r.content && <Typography sx={{ my: 2 }}>{r.content}</Typography>}
        <Typography variant="h6" component="h2">
          Ingredients
        </Typography>
        <ul>
          {splitLines(r.ingredients).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
        <Typography variant="h6" component="h2">
          Steps
        </Typography>
        <ol>
          {splitLines(r.steps).map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </article>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Link href="#/recipes" sx={{ display: 'inline-block', mb: 2 }}>
        Back to recipes
      </Link>
      {body}
    </Box>
  );
};

export default RecipeDetail;
