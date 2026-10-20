import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  Link,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import RecipeCard from '../components/RecipeCard';
import { ApiRecipe, listRecipes, splitLines } from '../services/recipes';
import logo from '../assets/icons/logo-mark.png';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; recipes: ApiRecipe[] };

const LoadingGrid = () => (
  <Grid container spacing={3} role="status" aria-label="Loading recipes">
    {[0, 1, 2].map((i) => (
      <Grid item xs={12} sm={6} md={4} key={i}>
        <Card aria-hidden="true">
          <Skeleton variant="rectangular" height={150} animation="wave" />
          <CardContent>
            <Skeleton width="70%" height={32} />
            <Skeleton width="90%" />
            <Skeleton width="40%" />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

const EmptyState = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box
    sx={{
      textAlign: 'center',
      py: 6,
      px: 3,
      border: '1px dashed',
      borderColor: 'divider',
      borderRadius: 'var(--bs-radius-lg)',
      bgcolor: 'background.paper',
    }}
  >
    <img src={logo} alt="" width={72} height={72} style={{ opacity: 0.85 }} />
    <Typography variant="h6" component="p" sx={{ mt: 1 }}>
      {title}
    </Typography>
    <Typography color="text.secondary" sx={{ mt: 0.5 }}>
      {children}
    </Typography>
  </Box>
);

const Recipes = () => {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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

  // Filter options: every tag in the loaded recipes, sorted.
  const allTags =
    state.status === 'ready'
      ? Array.from(new Set(state.recipes.flatMap((r) => r.tags ?? []))).sort((a, b) => a.localeCompare(b))
      : [];

  let body: React.ReactNode;
  if (state.status === 'loading') {
    body = <LoadingGrid />;
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
      <EmptyState title="No recipes yet">
        Run <code>go run . -setup-db</code> in the backend to load sample recipes, or{' '}
        <Link href="#/recipes/new">add your own</Link>.
      </EmptyState>
    );
  } else {
    const query = search.trim().toLowerCase();
    // A recipe matches the tag filter when it has any of the chosen tags.
    const shown = state.recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(query) &&
        (selectedTags.length === 0 || selectedTags.some((tag) => (r.tags ?? []).includes(tag)))
    );
    body =
      shown.length === 0 ? (
        <EmptyState title="Nothing matches">No recipes match these filters.</EmptyState>
      ) : (
        <Grid container spacing={3}>
          {shown.map((r) => (
            <Grid item xs={12} sm={6} md={4} key={r.id}>
              <RecipeCard
                id={r.id}
                title={r.title}
                content={r.content}
                ingredientCount={splitLines(r.ingredients).length}
                stepCount={splitLines(r.steps).length}
                tags={r.tags ?? []}
                userId={r.user_id}
                createdAt={r.created_at}
                href={`#/recipes/${r.id}`}
              />
            </Grid>
          ))}
        </Grid>
      );
  }

  const count = state.status === 'ready' ? state.recipes.length : null;

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 }, maxWidth: 1200, mx: 'auto' }}>
      <Box component="header" sx={{ mb: 4, maxWidth: 680 }}>
        <Typography
          variant="overline"
          sx={{ color: 'secondary.main', fontWeight: 700, letterSpacing: '0.12em' }}
        >
          {count === null ? 'Recipe board' : `${count} recipe${count === 1 ? '' : 's'}`}
        </Typography>
        <Typography variant="h3" component="h1" sx={{ fontSize: { xs: 34, sm: 44 }, lineHeight: 1.1 }}>
          Small recipes, easy to find.
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: 17 }}>
          Search by name or filter by tag. Each recipe keeps its ingredients and steps short.
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
          mb: 4,
        }}
      >
        <TextField
          label="Search Recipes"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
        <Autocomplete
          multiple
          options={allTags}
          value={selectedTags}
          onChange={(_, value) => setSelectedTags(value)}
          ChipProps={{ color: 'success', size: 'small' }}
          renderInput={(params) => <TextField {...params} label="Filter by tags" />}
        />
      </Box>
      {body}
    </Box>
  );
};

export default Recipes;
