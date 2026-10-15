import React from "react";
import { Box, Card, CardActionArea, CardContent, Chip, Typography } from "@mui/material";

interface RecipeCardProps {
  id: number;
  title: string;
  content: string;
  ingredients: string;
  steps: string;
  userId: number;
  createdAt: string;
  tags?: string[];
  /** When set, the whole card links here. */
  href?: string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ title, content, ingredients, steps, userId, createdAt, tags = [], href }) => {
  const body = (
      <CardContent>
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body2" color="textSecondary">{content}</Typography>
        <Typography variant="body2" color="textSecondary">Ingredients: {ingredients}</Typography>
        <Typography variant="body2" color="textSecondary">Steps: {steps}</Typography>
        {tags.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, my: 1 }}>
            {tags.map((tag) => <Chip key={tag} label={tag} size="small" />)}
          </Box>
        )}
        <Typography variant="caption" color="textSecondary">Posted by User {userId} on {new Date(createdAt).toLocaleDateString()}</Typography>
      </CardContent>
  );
  return <Card>{href ? <CardActionArea href={href}>{body}</CardActionArea> : body}</Card>;
};

export default RecipeCard;
