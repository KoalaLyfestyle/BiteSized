import React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import './RecipeCard.css';

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
      <CardContent className="card-content">
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body2" color="textSecondary" className="card-text">{content}</Typography>
        <Typography variant="body2" color="textSecondary" className="card-text">Ingredients: {ingredients}</Typography>
        <Typography variant="body2" color="textSecondary" className="card-text">Steps: {steps}</Typography>
        <Typography variant="caption" color="textSecondary">Posted by User {userId} on {new Date(createdAt).toLocaleDateString()}</Typography>
      </CardContent>
    </Card>
  );
};

export default RecipeCard;
