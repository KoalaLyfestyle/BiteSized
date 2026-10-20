import React from 'react';
import { AppBar, Box, Button, Container, Link, Toolbar, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import logo from '../assets/icons/logo-mark.png';
import { useHashRoute } from '../utils/useHashRoute';
import { palette } from '../styles/tokens';

const Header: React.FC = () => {
  const route = useHashRoute();
  const onList = route.page === 'recipes' || route.page === 'recipe';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'rgba(251, 245, 236, 0.92)',
        backdropFilter: 'blur(8px)',
        color: 'text.primary',
        borderBottom: `1px solid ${palette.line}`,
      }}
    >
      <Container maxWidth="lg" disableGutters>
        <Toolbar sx={{ gap: 2, minHeight: { xs: 60, sm: 68 } }}>
          <Link
            href="#/recipes"
            underline="none"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexGrow: 1 }}
          >
            <img src={logo} alt="" width={36} height={36} />
            <Typography
              component="span"
              sx={{ fontFamily: 'var(--bs-font-display)', fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em' }}
            >
              Bite<Box component="span" sx={{ color: 'primary.main' }}>Sized</Box>
            </Typography>
          </Link>
          <Box component="nav" aria-label="Main" sx={{ display: 'flex', gap: 1 }}>
            <Button
              href="#/recipes"
              color="inherit"
              aria-current={onList ? 'page' : undefined}
              sx={{ fontWeight: onList ? 700 : 500 }}
            >
              Recipes
            </Button>
            <Button
              href="#/recipes/new"
              variant="contained"
              color="secondary"
              startIcon={<AddRoundedIcon />}
              aria-current={route.page === 'new-recipe' ? 'page' : undefined}
            >
              Add recipe
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
