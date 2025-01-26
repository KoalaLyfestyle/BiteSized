import React, { useState } from 'react';
import { Box, TextField, Grid, Autocomplete } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import Header from '../components/Header';
import ThreadCard from '../components/ThreadCard';
import RecipeCard from '../components/RecipeCard';
import theme from '../styles/theme';
import { Thread, Recipe, isRecipe } from '../types/types';

const Home = () => {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const threads: Thread[] = [
    {
      id: 1,
      title: "Sample Thread Title 1",
      content: "This is a sample content for the thread.",
      userId: 123,
      createdAt: new Date().toISOString(),
      tags: ["General", "Discussion"]
    },
    {
      id: 2,
      title: "Sample Thread Title 2",
      content: "This is another sample content for the thread.",
      userId: 124,
      createdAt: new Date().toISOString(),
      tags: ["Help", "Support"]
    }
    // ... more sample threads
  ];

  const recipes: Recipe[] = [
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

  const combinedItems = [...threads, ...recipes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredItems = combinedItems.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase()) &&
    (selectedTags.length === 0 || selectedTags.some(tag => item.tags.includes(tag)))
  );

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
        <TextField
          label="Search"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3 }}
        />
        <Autocomplete
          multiple
          options={["General", "Discussion", "Help", "Support", "Feedback", "Breakfast", "Lunch", "Dinner", "Dessert", "Snack", "Healthy", "Quick"]}
          value={selectedTags}
          onChange={(e, newValue) => setSelectedTags(newValue)}
          renderInput={(params) => <TextField {...params} label="Filter by Tags" />}
          sx={{ mb: 3 }}
        />
        <Grid container spacing={3}>
          {filteredItems.map(item => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              {isRecipe(item) ? (
                <RecipeCard {...item} />
              ) : (
                <ThreadCard {...item} />
              )}
            </Grid>
          ))}
        </Grid>
      </Box>
    </ThemeProvider>
  );
};

export default Home;
