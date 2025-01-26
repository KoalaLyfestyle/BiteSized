import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

interface ThreadCardProps {
  id: number;
  title: string;
  content: string;
  userId: number;
  createdAt: string;
}

const ThreadCard: React.FC<ThreadCardProps> = ({ title, content, userId, createdAt }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5">{title}</Typography>
        <Typography variant="body2" color="textSecondary">{content}</Typography>
        <Typography variant="caption" color="textSecondary">Posted by User {userId} on {new Date(createdAt).toLocaleDateString()}</Typography>
      </CardContent>
    </Card>
  );
};

export default ThreadCard;
