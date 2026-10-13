import React from "react";
import { Card, CardActionArea, CardContent, Typography } from "@mui/material";

interface RecipeCardProps {
  id: number;
  title: string;
  content: string;
  ingredients: string;
  steps: string;
  userId: number;
  createdAt: string;
  /** When set, the whole card links here. */
  href?: string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ title, content, ingredients, steps, userId, createdAt, href }) => {
  const body = (
      <CardContent>
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body2" color="textSecondary">{content}</Typography>
        <Typography variant="body2" color="textSecondary">Ingredients: {ingredients}</Typography>
        <Typography variant="body2" color="textSecondary">Steps: {steps}</Typography>
        <Typography variant="caption" color="textSecondary">Posted by User {userId} on {new Date(createdAt).toLocaleDateString()}</Typography>
      </CardContent>
  );
  return <Card>{href ? <CardActionArea href={href}>{body}</CardActionArea> : body}</Card>;
};

export default RecipeCard;
