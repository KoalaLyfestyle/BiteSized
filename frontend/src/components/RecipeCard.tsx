import React from 'react';
import { Box, Card, CardActionArea, CardContent, Chip, Typography } from '@mui/material';
import RecipeArt from './RecipeArt';

interface RecipeCardProps {
  id: number;
  title: string;
  content: string;
  ingredientCount: number;
  stepCount: number;
  userId: number;
  createdAt: string;
  tags?: string[];
  imageUrl?: string;
  /** When set, the whole card links here. */
  href?: string;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const RecipeCard: React.FC<RecipeCardProps> = ({
  id,
  title,
  content,
  ingredientCount,
  stepCount,
  userId,
  createdAt,
  tags = [],
  imageUrl,
  href,
}) => {
  const body = (
    <>
      <RecipeArt id={id} title={title} imageUrl={imageUrl} height={150} />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, p: 2.5 }}>
        <Typography variant="h6" component="h2" sx={{ lineHeight: 1.25 }}>
          {title}
        </Typography>
        {content && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          >
            {content}
          </Typography>
        )}
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          {plural(ingredientCount, 'ingredient')} · {plural(stepCount, 'step')}
        </Typography>
        {tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" color="success" />
            ))}
          </Box>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', pt: 0.5 }}>
          Posted by User {userId} on {new Date(createdAt).toLocaleDateString()}
        </Typography>
      </CardContent>
    </>
  );
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': href ? { boxShadow: '0 10px 28px rgba(59, 36, 22, 0.12)', transform: 'translateY(-2px)' } : {},
      }}
    >
      {href ? (
        <CardActionArea
          href={href}
          sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
        >
          {body}
        </CardActionArea>
      ) : (
        body
      )}
    </Card>
  );
};

export default RecipeCard;
