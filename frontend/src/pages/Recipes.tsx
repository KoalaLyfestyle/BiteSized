import React, { useState } from 'react';
import { Box, TextField, Grid, Autocomplete } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import Header from '../components/Header';
import RecipeCard from '../components/RecipeCard';
import theme from '../styles/theme';

const Recipes = () => {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const recipes = [
    {
      id: 1,
      title: "Sample Recipe Title 1",
      content: "This is a sample content for the recipe.",
      ingredients: "Sample ingredients",
      steps: "Sample steps",
      userId: 123,
      createdAt: new Date().toISOString(),
      tags: ["Breakfast", "Healthy"]
    },
    {
      id: 2,
      title: "Sample Recipe Title 2",
      content: "This is a sample content for the recipe.",
      ingredients: "Sample ingredients",
      steps: "Sample steps",
      userId: 123,
      createdAt: new Date().toISOString(),
      tags: ["Lunch", "Quick"]
    }
    // ... more sample recipes
  ];

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(search.toLowerCase()) &&
    (selectedTags.length === 0 || selectedTags.some(tag => recipe.tags.includes(tag)))
  );

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
        <TextField
          label="Search Recipes"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3 }}
        />
        <Autocomplete
          multiple
          options={["Breakfast", "Lunch", "Dinner", "Dessert", "Snack", "Healthy", "Quick"]}
          value={selectedTags}
          onChange={(e, newValue) => setSelectedTags(newValue)}
          renderInput={(params) => <TextField {...params} label="Filter by Tags" />}
          sx={{ mb: 3 }}
        />
        <Grid container spacing={3}>
          {filteredRecipes.map(recipe => (
            <Grid item xs={12} sm={6} md={4} key={recipe.id}>
              <RecipeCard {...recipe} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </ThemeProvider>
  );
};

export default Recipes;
