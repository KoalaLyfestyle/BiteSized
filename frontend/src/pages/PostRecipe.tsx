import React, { useEffect, useState } from 'react';
import { Alert, Autocomplete, Box, TextField, Button, List, ListItem, ListItemText, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { ApiError, FieldErrors, RecipeInput, cleanTags, createRecipe, getAppConfig, validateRecipe } from '../services/recipes';
import { navigate } from '../utils/useHashRoute';

const PostRecipe = () => {
const [title, setTitle] = useState('');
const [description, setDescription] = useState('');
const [ingredient, setIngredient] = React.useState('');
const [ingredients, setIngredients] = React.useState<string[]>([]);
const [step, setStep] = React.useState('');
const [steps, setSteps] = React.useState<string[]>([]);
const [tags, setTags] = useState<string[]>([]);

const [authoring, setAuthoring] = useState<boolean | null>(null);
const [errors, setErrors] = useState<FieldErrors>({});
const [formError, setFormError] = useState('');
const [submitting, setSubmitting] = useState(false);

useEffect(() => {
    getAppConfig()
    .then((c) => setAuthoring(c.authoring))
    .catch(() => setAuthoring(false));
}, []);

const handleSubmit = async () => {
    // Ingredients and steps are stored one per line.
    // Keep an item that was typed but not added yet.
    const allIngredients = ingredient.trim() ? [...ingredients, ingredient.trim()] : ingredients;
    const allSteps = step.trim() ? [...steps, step.trim()] : steps;
    if (allIngredients !== ingredients) { setIngredients(allIngredients); setIngredient(''); }
    if (allSteps !== steps) { setSteps(allSteps); setStep(''); }
    const input: RecipeInput = {
    title,
    content: description,
    ingredients: allIngredients.join('\n'),
    steps: allSteps.join('\n'),
    tags: cleanTags(tags),
    };
    const found = validateRecipe(input);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) {
    setFormError('Fix the highlighted fields before posting.');
    return;
    }
    setSubmitting(true);
    try {
    const recipe = await createRecipe(input);
    navigate(`/recipes/${recipe.id}`);
    } catch (err) {
    const apiErr = err instanceof ApiError ? err : new ApiError(0, String(err));
    setErrors(apiErr.fields);
    setFormError(apiErr.message);
    } finally {
    setSubmitting(false);
    }
};

const fieldLabel = { title: 'Title', content: 'Description', ingredients: 'Ingredients', steps: 'Steps', tags: 'Tags' };
const errorText = (field: keyof RecipeInput) => (errors[field] ? `${fieldLabel[field]} ${errors[field]}` : undefined);

if (authoring === false) {
    return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Alert severity="info">
        This demo is read-only. To add recipes on your own machine, start the backend with{' '}
        <code>AUTHORING_ENABLED=true</code>.
        </Alert>
    </Box>
    );
}

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
        <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
            </Alert>
        )}
        <TextField // Input box for recipe title
            label="Recipe Title"
            fullWidth
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!errors.title}
            helperText={errorText('title')}
            sx={{ mb: 2 }}
        />
        <Autocomplete // Tags: type one and press Enter; a typed tag is kept on leaving the field
            multiple
            freeSolo
            autoSelect
            options={[]}
            value={tags}
            onChange={(_, value) => setTags(cleanTags(value))}
            renderInput={(params) => (
            <TextField
                {...params}
                label="Tags"
                error={!!errors.tags}
                helperText={errorText('tags') ?? 'Press Enter after each tag'}
            />
            )}
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
            error={!!errors.content}
            helperText={errorText('content')}
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
            error={!!errors.ingredients}
            helperText={errorText('ingredients') ?? 'Press Enter or Add Ingredient after each one'}
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
            type="button"
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
            error={!!errors.steps}
            helperText={errorText('steps') ?? 'Press Enter or Add Step after each one'}
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
            type="button"
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
            type="submit"
            disabled={submitting || authoring === null}
            sx={{ textTransform: "none" }}
        >
            {submitting ? 'Posting...' : 'Post Recipe'}
        </Button>
        </Box>
    </>
);
};

export default PostRecipe;
