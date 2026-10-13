import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import PostRecipe from './pages/PostRecipe';
import theme from './styles/theme';
import { useHashRoute } from './utils/useHashRoute';

function App() {
  const route = useHashRoute();

  let page: React.ReactNode;
  switch (route.page) {
    case 'recipes':
      page = <Recipes />;
      break;
    case 'new-recipe':
      page = <PostRecipe />;
      break;
    case 'recipe':
      page = <RecipeDetail id={route.id} />;
      break;
    default:
      page = (
        <Box sx={{ p: 3 }}>
          <Typography variant="h5">Page not found</Typography>
          <Link href="#/recipes">Back to recipes</Link>
        </Box>
      );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      {page}
    </ThemeProvider>
  );
}

export default App;
