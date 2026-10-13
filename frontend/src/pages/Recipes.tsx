import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Grid, TextField, Typography } from '@mui/material';
import RecipeCard from '../components/RecipeCard';
import { ApiRecipe, listRecipes, splitLines } from '../services/recipes';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; recipes: ApiRecipe[] };

const Recipes = () => {
  const [search, setSearch] = useState('');
  const [state, setState] = useState<State>({ status: 'loading' });

  const load = useCallback((isActive: () => boolean = () => true) => {
    setState({ status: 'loading' });
    listRecipes()
      .then((recipes) => isActive() && setState({ status: 'ready', recipes: recipes ?? [] }))
      .catch((err: Error) => isActive() && setState({ status: 'error', message: err.message }));
  }, []);

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
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress aria-label="Loading recipes" />
      </Box>
    );
  } else if (state.status === 'error') {
    body = (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => load()}>
            Retry
          </Button>
        }
      >
        Could not load recipes: {state.message}
      </Alert>
    );
  } else if (state.recipes.length === 0) {
    body = (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h6">No recipes yet</Typography>
        <Typography color="textSecondary">
          Run <code>go run . -setup-db</code> in the backend to load sample recipes, or{' '}
          <a href="#/recipes/new">add your own</a>.
        </Typography>
      </Box>
    );
  } else {
    const query = search.trim().toLowerCase();
    const shown = state.recipes.filter((r) => r.title.toLowerCase().includes(query));
    body =
      shown.length === 0 ? (
        <Typography color="textSecondary">No recipes match "{search}".</Typography>
      ) : (
        <Grid container spacing={3}>
          {shown.map((r) => (
            <Grid item xs={12} sm={6} md={4} key={r.id}>
              <RecipeCard
                id={r.id}
                title={r.title}
                content={r.content}
                ingredients={splitLines(r.ingredients).join(', ')}
                steps={`${splitLines(r.steps).length} steps`}
                userId={r.user_id}
                createdAt={r.created_at}
                href={`#/recipes/${r.id}`}
              />
            </Grid>
          ))}
        </Grid>
      );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <TextField
        label="Search Recipes"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
      />
      {body}
    </Box>
  );
};

export default Recipes;
