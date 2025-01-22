import React, { useState } from 'react';
import { Box, TextField, Button, List, ListItem, ListItemText, IconButton, Typography } from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Header from '../components/Header';

const filter = createFilterOptions<string>();

const PostThread = () => {
const [title, setTitle] = useState('');
const [tags, setTags] = useState<string[]>([]);
const [content, setContent] = useState('');

const handleSubmit = () => {
    console.log({ title, tags }); // Replace with API call
};

return (
    <>
        <Header />
        <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
            <TextField // Input box for thread title
                label="Thread Title"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 2 }}
            />
            <Autocomplete // Input box for tags
                multiple
                freeSolo
                filterOptions={(options, params) => {
                    const filtered = filter(options, params);

                    const { inputValue } = params;
                    const isExisting = options.some((option) => inputValue === option);
                    if (inputValue !== "" && !isExisting) {
                        filtered.push(`Add "${inputValue}"`);
                    }

                    return filtered;
                }}
                options={["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"]}
                value={tags}
                onChange={(e, newValue) => setTags(newValue)}
                renderInput={(params) => <TextField {...params} label="Tags" />}
                sx={{ mb: 2 }}
            />
            <TextField // Input box for content
                label="Content"
                fullWidth
                multiline
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                sx={{ mb: 2 }}
            />
            <Typography // Word count
                variant="body2"
                color="textSecondary"
                sx={{
                    position: "absolute",
                    bottom: 8,
                    right: 8,
                    fontSize: "0.75rem",
                }}
                >
                {
                    content.split(/\s+/).filter((word: string) => word.length > 0)
                    .length
                }{" "}
                words
            </Typography>
            <Button // Button to post thread
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                sx={{ textTransform: "none" }}
            >
                Post Thread
            </Button>
        </Box>
    </>
);
};

export default PostThread;
