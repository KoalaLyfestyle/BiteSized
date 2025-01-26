import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

interface RecipeCardProps {
  id: number;
  title: string;
  content: string;
  ingredients: string;
  steps: string;
  userId: number;
  createdAt: string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ title, content, ingredients, steps, userId, createdAt }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body2" color="textSecondary">{content}</Typography>
        <Typography variant="body2" color="textSecondary">Ingredients: {ingredients}</Typography>
        <Typography variant="body2" color="textSecondary">Steps: {steps}</Typography>
        <Typography variant="caption" color="textSecondary">Posted by User {userId} on {new Date(createdAt).toLocaleDateString()}</Typography>
      </CardContent>
    </Card>
  );
};

export default RecipeCard;
