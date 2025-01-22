import React, { useState } from 'react';
import { Box, TextField, Button, List, ListItem, ListItemText, IconButton, Typography } from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import DeleteIcon from '@mui/icons-material/Delete';
import Header from '../components/Header';

const filter = createFilterOptions<string>();

const PostRecipe = () => {
const [title, setTitle] = useState('');
const [tags, setTags] = useState<string[]>([]);
const [description, setDescription] = useState('');
const [ingredient, setIngredient] = React.useState('');
const [ingredients, setIngredients] = React.useState<string[]>([]);
const [step, setStep] = React.useState('');
const [steps, setSteps] = React.useState<string[]>([]);

const handleSubmit = () => {
    console.log({ title, tags }); // Replace with API call
};

const handleAddIngredient = () => {
    if (ingredient.trim() !== '') {
    setIngredients([...ingredients, ingredient.trim()]);
    setIngredient('');
    }
};

const handleDeleteIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
};

const handleAddStep = () => {
    if (step.trim() !== '') {
    setSteps([...steps, step.trim()]);
    setStep('');
    }
}

const handleDeleteStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
};

return (
    <>
        <Header />
        <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <TextField // Input box for recipe title
            label="Recipe Title"
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
        <Box sx={{ position: "relative", mb: 2 }}>
            <TextField // Input box for description
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
                description.split(/\s+/).filter((word: string) => word.length > 0)
                .length
            }{" "}
            words
            </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
            <TextField // Input box for ingredients
            label="Ingredient"
            fullWidth
            value={ingredient}
            onChange={(e) => setIngredient(e.target.value)}
            sx={{ mb: 1 }}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                handleAddIngredient();
                e.preventDefault();
                }
            }}
            />
            <Button // Button to add ingredient
            variant="contained"
            color="secondary"
            onClick={handleAddIngredient}
            sx={{ textTransform: "none" }}
            >
            Add Ingredient
            </Button>
            <List>
            {ingredients.map((ing, index) => (
                <ListItem // List of ingredients
                key={index}
                secondaryAction={
                    <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteIngredient(index)}
                    >
                    <DeleteIcon />
                    </IconButton>
                }
                >
                <ListItemText primary={`${index + 1}. ${ing}`} />
                </ListItem>
            ))}
            </List>{" "}
        </Box>
        <Box sx={{ mb: 2 }}>
            <TextField // Input box for steps
            label="Steps"
            fullWidth
            value={step}
            onChange={(e) => setStep(e.target.value)}
            sx={{ mb: 1 }}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                handleAddStep();
                e.preventDefault();
                }
            }}
            />
            <Button // Button to add step
            variant="contained"
            color="secondary"
            onClick={handleAddStep}
            sx={{ textTransform: "none" }}
            >
            Add Step
            </Button>
            <List>
            {steps.map((ing, index) => (
                <ListItem // List of steps
                key={index}
                secondaryAction={
                    <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteStep(index)}
                    >
                    <DeleteIcon />
                    </IconButton>
                }
                >
                <ListItemText primary={`${index + 1}. ${ing}`} />
                </ListItem>
            ))}
            </List>{" "}
        </Box>
        <Button // Button to post recipe
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{ textTransform: "none" }}
        >
            Post Recipe
        </Button>
        </Box>
    </>
);
};

export default PostRecipe;
