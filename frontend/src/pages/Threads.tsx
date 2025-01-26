import React, { useState } from 'react';
import { Box, TextField, Grid, Autocomplete } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import Header from '../components/Header';
import ThreadCard from '../components/ThreadCard';
import theme from '../styles/theme';
import { Item } from '../types/types';

const Threads = () => {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const threads: Item[] = [
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

  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(search.toLowerCase()) &&
    (selectedTags.length === 0 || selectedTags.some(tag => thread.tags.includes(tag)))
  );

  return (
    <ThemeProvider theme={theme}>
      <Header />
      <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
        <TextField
          label="Search Threads"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 3 }}
        />
        <Autocomplete
          multiple
          options={["General", "Discussion", "Help", "Support", "Feedback"]}
          value={selectedTags}
          onChange={(e, newValue) => setSelectedTags(newValue)}
          renderInput={(params) => <TextField {...params} label="Filter by Tags" />}
          sx={{ mb: 3 }}
        />
        <Grid container spacing={3}>
          {filteredThreads.map(thread => (
            <Grid item xs={12} sm={6} md={4} key={thread.id}>
              <ThreadCard {...thread} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </ThemeProvider>
  );
};

export default Threads;
