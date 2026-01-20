import { useContext, useEffect, useState } from "react";
import { Box, Button, IconButton, Drawer, Avatar, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import { BrowserRouter as Router, Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { Menu, Activity, Target, Star, Lightbulb, LogOut, Settings } from "lucide-react";
import { AuthContext, AuthProvider } from "react-oauth2-code-pkce";
import {authConfig} from "./authConfig"; // ⭐ IMPORT AUTH CONFIG
import ActivityList from "./components/ActivityList";
import ActivityDetail from "./components/ActivityDetail";
import ActivityForm from "./components/ActivityForm";
import Recommendations from "./components/Recommendations";
import Homepage from "./components/Homepage";
import Register from "./components/auth/Register";
import EmailVerification from "./components/auth/EmailVerification";
import { useDispatch } from "react-redux";
import { setCredentials } from "./store/authSlice";
import './App.css';

// Dark theme configuration
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#8ab4f8",
    },
    background: {
      default: "#0a0a0a",
      paper: "#1a1a1a",
    },
  },
});

function AppContent() {
  const { tokenData, token, logOut, loginInProgress } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // useEffect for authentication
  useEffect(() => {
    console.log('🔍 Auth State:', { 
      hasToken: !!token, 
      hasTokenData: !!tokenData,
      loginInProgress 
    });

    if (token && tokenData) {
      dispatch(setCredentials({
        token, 
        user: tokenData
      }));

      // Store userId - try multiple possible field names
      const userId = tokenData.sub
        || tokenData.user_id 
        || tokenData.preferred_username 
        || tokenData.email 
        || tokenData.userId
        || tokenData.id;
        
      if (userId) {
        localStorage.setItem('userId', userId);
        localStorage.setItem("token", token);
        console.log('✅ UserId stored in localStorage:', userId);
        console.log('✅ Full tokenData:', tokenData);
      } else {
        console.error('❌ No userId found in tokenData:', tokenData);
      }

      console.log('✅ Authentication ready');
    } else {
      console.log('⚠️ No token or tokenData yet');
    }
  }, [token, tokenData, dispatch, loginInProgress]);

  const menuItems = [
    { text: "Activities", icon: <Activity size={20} />, path: "/dashboard" },
    { text: "Recommendations", icon: <Lightbulb size={20} />, path: "/recommendations" },
    { text: "Goals", icon: <Target size={20} />, path: "/goals" },
    { text: "Favorites", icon: <Star size={20} />, path: "/favorites" },
  ];

  const drawer = token ? (
    <Box 
      sx={{ 
        width: 260, 
        height: "100%", 
        bgcolor: "#1a1a1a", 
        color: "white", 
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(128, 128, 128, 0.2)"
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 3, borderBottom: "1px solid rgba(128, 128, 128, 0.1)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Activity size={28} color="#888" />
          <Box>
            <Box sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#ddd", letterSpacing: "1px" }}>
              FITNESS TIPS
            </Box>
            <Box sx={{ fontSize: "0.7rem", color: "#666", letterSpacing: "1px" }}>
              HEALTH SYSTEM
            </Box>
          </Box>
        </Box>
      </Box>

      {/* User Info */}
      {tokenData && (
        <Box sx={{ p: 2.5, borderBottom: "1px solid rgba(128, 128, 128, 0.1)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: "#888", fontSize: "1rem" }}>
              {(tokenData.sub || tokenData.preferred_username || 'U')?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Box sx={{ fontSize: "0.9rem", color: "#ddd", fontWeight: 500 }}>
                {tokenData.preferred_username || tokenData.sub || 'User'}
              </Box>
              <Box sx={{ fontSize: "0.75rem", color: "#666" }}>
                Premium Member
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Navigation Menu */}
      <List sx={{ flex: 1, px: 1.5, py: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                console.log('[Navigation] Clicked:', item.text, '→', item.path);
                navigate(item.path);
                if (mobileOpen) setMobileOpen(false);
              }}
              sx={{
                borderRadius: "8px",
                color: location.pathname === item.path ? "#ddd" : "#888",
                bgcolor: location.pathname === item.path ? "rgba(128, 128, 128, 0.15)" : "transparent",
                "&:hover": {
                  bgcolor: "rgba(128, 128, 128, 0.1)",
                  color: "#ddd",
                },
                transition: "all 0.2s ease",
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: "0.9rem",
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ borderColor: "rgba(128, 128, 128, 0.1)" }} />

      {/* Bottom Section - Settings & Logout */}
      <Box sx={{ p: 2 }}>
        <ListItem disablePadding sx={{ mb: 1 }}>
          <ListItemButton
            sx={{
              borderRadius: "8px",
              color: "#888",
              "&:hover": {
                bgcolor: "rgba(128, 128, 128, 0.1)",
                color: "#ddd",
              },
            }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>
              <Settings size={20} />
            </ListItemIcon>
            <ListItemText 
              primary="Settings"
              primaryTypographyProps={{ fontSize: "0.9rem" }}
            />
          </ListItemButton>
        </ListItem>

        <Button
          onClick={() => {
            console.log('🚪 Logging out...');
            logOut();
          }}
          fullWidth
          startIcon={<LogOut size={18} />}
          sx={{
            color: "#ff6b6b",
            borderColor: "rgba(255, 107, 107, 0.3)",
            textTransform: "none",
            py: 1.2,
            borderRadius: "8px",
            justifyContent: "flex-start",
            pl: 2,
            "&:hover": {
              bgcolor: "rgba(255, 107, 107, 0.1)",
              borderColor: "rgba(255, 107, 107, 0.5)",
            },
          }}
          variant="outlined"
        >
          Logout
        </Button>
      </Box>
    </Box>
  ) : null;

  const renderProtectedRoute = (Component) => {
    return token ? (
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#0a0a0a" }}>
        <Box component="nav" sx={{ width: { sm: 260 }, flexShrink: { sm: 0 } }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: 260 },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: 260 },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box component="main" sx={{ flexGrow: 1, width: { sm: `calc(100% - 260px)` }, p: 4 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mb: 2, 
              display: { sm: "none" }, 
              color: "#888",
              bgcolor: "rgba(128, 128, 128, 0.1)",
              "&:hover": {
                bgcolor: "rgba(128, 128, 128, 0.2)",
              }
            }}
          >
            <Menu />
          </IconButton>
          {Component}
        </Box>
      </Box>
    ) : (
      <Navigate to="/" />
    );
  };

  // Show loading only during OAuth redirect
  if (loginInProgress) {
    console.log("⏳ Login in progress...");
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          bgcolor: "#0a0a0a",
          color: "#888",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Activity size={48} color="#888" style={{ marginBottom: "16px" }} />
          <div>Authenticating...</div>
        </Box>
      </Box>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Homepage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<EmailVerification />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={renderProtectedRoute(<ActivityList />)}
      />
      
      <Route
        path="/activity/new"
        element={renderProtectedRoute(<ActivityForm />)}
      />
      
      <Route
        path="/activity/:id"
        element={renderProtectedRoute(<ActivityDetail />)}
      />
      
      <Route
        path="/recommendations"
        element={renderProtectedRoute(<Recommendations />)}
      />
      
      <Route 
        path="/goals" 
        element={renderProtectedRoute(<Box sx={{ color: "#ddd" }}>Goals Page - Coming Soon</Box>)} 
      />
      
      <Route 
        path="/favorites" 
        element={renderProtectedRoute(<Box sx={{ color: "#ddd" }}>Favorites Page - Coming Soon</Box>)} 
      />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  console.log('🚀 App component rendering');
  console.log('📋 Auth Config:', authConfig); // Debug log

  return (
    <AuthProvider authConfig={authConfig}> {/* ⭐ PASS AUTH CONFIG HERE */}
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;