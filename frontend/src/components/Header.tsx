import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import logo from '../assets/icons/logo.png';

const Header: React.FC = () => {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <img src={logo} alt="Logo" style={{ marginRight: '0px', height: '80px' }} />
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          BiteSized
        </Typography>
        <Button color="inherit">Home</Button>
        <Button color="inherit">Recipes</Button>
        <Button color="inherit">Threads</Button>
        <Button color="inherit">Profile</Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
