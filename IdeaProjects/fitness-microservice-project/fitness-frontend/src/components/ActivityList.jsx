import { useState, useEffect, useContext } from "react";
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip, 
  CircularProgress, 
  Button, 
  IconButton, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  ToggleButtonGroup, 
  ToggleButton 
} from "@mui/material";
import { 
  Activity, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Clock, 
  MapPin, 
  Target, 
  Edit2, 
  ChevronRight, 
  Flame 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "react-oauth2-code-pkce";
import { getActivities } from "../services/api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import { deleteActivity } from '../services/api';

function ActivityList() {
  const { token, tokenData } = useContext(AuthContext);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weeklyGoal, setWeeklyGoal] = useState(3000);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [tempGoal, setTempGoal] = useState(3000);
  const [viewMode, setViewMode] = useState("week");
  const navigate = useNavigate();

  // Load weekly goal from localStorage
  useEffect(() => {
    const savedGoal = localStorage.getItem("weeklyCalorieGoal");
    if (savedGoal) {
      const goalValue = parseInt(savedGoal);
      setWeeklyGoal(goalValue);
      setTempGoal(goalValue);
    }
  }, []);

  const handleDelete = async (activityId) => {
  if (window.confirm('Are you sure you want to delete this activity?')) {
    try {
      await deleteActivity(activityId);
      // Refresh the list or remove from state
      setActivities(activities.filter(a => a.id !== activityId));
    } catch (error) {
      console.error('Error deleting activity:', error);
      alert('Failed to delete activity');
    }
  }
};
<button onClick={() => handleDelete(activity.id)}>Delete</button>

  // Fetch activities
  const fetchActivities = async () => {
    if (!token) {
      console.warn('[ActivityList] No token available, skipping fetch');
      setLoading(false);
      setError('Please log in to view activities');
      return;
    }

    console.log('[ActivityList] ========== FETCHING ACTIVITIES ==========');
    console.log('[ActivityList] Token available:', !!token);
    console.log('[ActivityList] User ID:', localStorage.getItem('userId'));

    setLoading(true);
    setError(null);

    try {
      const response = await getActivities();
      
      console.log('[ActivityList] Raw response:', response);
      console.log('[ActivityList] Response data:', response.data);
      
      const activitiesData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.activities || [];
     
      setActivities(activitiesData);
      console.log('[ActivityList] Activities loaded:', activitiesData.length, 'items');
      
      if (activitiesData.length > 0) {
        console.log('[ActivityList] ========== ALL ACTIVITIES ==========');
        activitiesData.forEach((act, idx) => {
          console.log(`[ActivityList] Activity [${idx}]:`, {
            id: act.id,
            type: act.type,
            duration: act.duration,
            calories: act.calories,
            date: act.activityDate || act.createdAt
          });
        });
        console.log('[ActivityList] ========== END LIST ==========');
      }
    } catch (error) {
      console.error('[ActivityList] Error fetching activities:', error);
      console.error('[ActivityList] Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to load activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchActivities();
    }
  }, [token]);

  // Group activities by time period
  const getGroupedActivities = () => {
    const grouped = {};
    const sortedActivities = [...activities].sort((a, b) => {
      const dateA = new Date(a.activityDate || a.createdAt);
      const dateB = new Date(b.activityDate || b.createdAt);
      return dateB - dateA;
    });

    sortedActivities.forEach(activity => {
      const date = new Date(activity.activityDate || activity.createdAt);
      let key;

      if (viewMode === "day") {
        key = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
      } else if (viewMode === "week") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      } else {
        key = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(activity);
    });

    return grouped;
  };

  // Calculate weekly data for chart
  const getWeeklyChartData = () => {
    const today = new Date();
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayActivities = activities.filter(activity => {
        const activityDate = new Date(activity.activityDate || activity.createdAt);
        return activityDate.toDateString() === date.toDateString();
      });

      data.push({
        day: daysOfWeek[date.getDay()],
        date: date.getDate(),
        calories: dayActivities.reduce((sum, a) => sum + (Number(a.calories) || 0), 0),
        count: dayActivities.length,
      });
    }

    return data;
  };

  const weeklyData = getWeeklyChartData();
  const weeklyCalories = weeklyData.reduce((sum, d) => sum + (d.calories || 0), 0);
  const weeklyProgress = weeklyGoal > 0 ? (weeklyCalories / weeklyGoal) * 100 : 0;

  // Chart configuration
  const chartData = {
    labels: weeklyData.map(d => d.day),
    datasets: [
      {
        label: 'Calories Burned',
        data: weeklyData.map(d => d.calories),
        fill: true,
        backgroundColor: 'rgba(138, 180, 248, 0.1)',
        borderColor: 'rgba(138, 180, 248, 1)',
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: 'rgba(138, 180, 248, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Daily Goal',
        data: Array(7).fill(weeklyGoal / 7),
        fill: false,
        borderColor: 'rgba(255, 107, 107, 0.5)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#888',
          font: {
            size: 11,
          },
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        titleColor: '#ddd',
        bodyColor: '#888',
        borderColor: 'rgba(128, 128, 128, 0.3)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `Calories: ${context.parsed.y} cal`;
            }
            return `Goal: ${context.parsed.y} cal`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(128, 128, 128, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#888',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(128, 128, 128, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#888',
          font: {
            size: 11,
          },
          callback: function(value) {
            return value + ' cal';
          },
        },
        beginAtZero: true,
      },
    },
  };

  const handleSaveGoal = () => {
    setWeeklyGoal(tempGoal);
    localStorage.setItem("weeklyCalorieGoal", tempGoal.toString());
    setGoalDialogOpen(false);
  };

  const groupedActivities = getGroupedActivities();

  if (error) {
    return (
      <Box sx={{ 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "70vh",
        gap: 2
      }}>
        <Activity size={64} color="#ff6b6b" />
        <Typography sx={{ color: "#ff6b6b", fontSize: "1.2rem", fontWeight: 600 }}>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={fetchActivities}
          sx={{
            bgcolor: "rgba(138, 180, 248, 0.2)",
            color: "#8ab4f8",
            textTransform: "none",
            "&:hover": { bgcolor: "rgba(138, 180, 248, 0.3)" }
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <CircularProgress sx={{ color: "#888" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", maxWidth: 1800, margin: "0 auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ color: "#ddd", fontWeight: 700, letterSpacing: "-0.5px", mb: 0.5 }}>
            Activity Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "#888", fontSize: "0.95rem" }}>
            Track your fitness progress and achieve your goals
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => navigate('/activity/new')}
          sx={{
            bgcolor: "rgba(138, 180, 248, 0.2)",
            color: "#8ab4f8",
            textTransform: "none",
            px: 3,
            py: 1.2,
            borderRadius: "8px",
            border: "1px solid rgba(138, 180, 248, 0.3)",
            fontSize: "0.95rem",
            fontWeight: 500,
            "&:hover": {
              bgcolor: "rgba(138, 180, 248, 0.3)",
              transform: "translateY(-2px)",
              boxShadow: "0 8px 16px rgba(138, 180, 248, 0.2)",
            },
            transition: "all 0.3s ease",
          }}
        >
          New Activity
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Left Side - Stats and Activities */}
        <Grid item xs={12} lg={8}>
          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={6} md={3}>
              <Card
                sx={{
                  bgcolor: "rgba(26, 26, 26, 0.6)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(128, 128, 128, 0.2)",
                  borderRadius: "12px",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      bgcolor: "rgba(255, 107, 107, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1.5,
                    }}
                  >
                    <Activity size={20} color="#ff6b6b" />
                  </Box>
                  <Typography sx={{ color: "#666", fontSize: "0.7rem", textTransform: "uppercase", mb: 0.5 }}>
                    Activities
                  </Typography>
                  <Typography sx={{ color: "#ddd", fontSize: "1.6rem", fontWeight: 700 }}>
                    {activities.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
              <Card
                sx={{
                  bgcolor: "rgba(26, 26, 26, 0.6)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(128, 128, 128, 0.2)",
                  borderRadius: "12px",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      bgcolor: "rgba(255, 217, 61, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1.5,
                    }}
                  >
                    <Clock size={20} color="#ffd93d" />
                  </Box>
                  <Typography sx={{ color: "#666", fontSize: "0.7rem", textTransform: "uppercase", mb: 0.5 }}>
                    Time
                  </Typography>
                  <Typography sx={{ color: "#ddd", fontSize: "1.6rem", fontWeight: 700 }}>
                    {activities.reduce((sum, a) => sum + (Number(a.duration) || 0), 0)}m
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
              <Card
                sx={{
                  bgcolor: "rgba(26, 26, 26, 0.6)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(128, 128, 128, 0.2)",
                  borderRadius: "12px",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      bgcolor: "rgba(107, 207, 127, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1.5,
                    }}
                  >
                    <MapPin size={20} color="#6bcf7f" />
                  </Box>
                  <Typography sx={{ color: "#666", fontSize: "0.7rem", textTransform: "uppercase", mb: 0.5 }}>
                    Distance
                  </Typography>
                  <Typography sx={{ color: "#ddd", fontSize: "1.6rem", fontWeight: 700 }}>
                    {activities.reduce((sum, a) => sum + (Number(a.additionalMetrics?.distance) || 0), 0).toFixed(1)}km
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} sm={6} md={3}>
              <Card
                sx={{
                  bgcolor: "rgba(26, 26, 26, 0.6)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(128, 128, 128, 0.2)",
                  borderRadius: "12px",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      bgcolor: "rgba(138, 180, 248, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1.5,
                    }}
                  >
                    <Flame size={20} color="#8ab4f8" />
                  </Box>
                  <Typography sx={{ color: "#666", fontSize: "0.7rem", textTransform: "uppercase", mb: 0.5 }}>
                    Calories
                  </Typography>
                  <Typography sx={{ color: "#ddd", fontSize: "1.6rem", fontWeight: 700 }}>
                    {activities.reduce((sum, a) => sum + (Number(a.calories) || 0), 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filter Tabs */}
          <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ color: "#ddd", fontSize: "1.1rem", fontWeight: 600 }}>
              Activities
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
              sx={{
                "& .MuiToggleButton-root": {
                  color: "#888",
                  borderColor: "rgba(128, 128, 128, 0.2)",
                  textTransform: "none",
                  px: 2,
                  fontSize: "0.85rem",
                  "&.Mui-selected": {
                    bgcolor: "rgba(138, 180, 248, 0.2)",
                    color: "#8ab4f8",
                    borderColor: "rgba(138, 180, 248, 0.3)",
                  },
                },
              }}
            >
              <ToggleButton value="day">Day</ToggleButton>
              <ToggleButton value="week">Week</ToggleButton>
              <ToggleButton value="month">Month</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Grouped Activities */}
          {Object.entries(groupedActivities).map(([period, periodActivities]) => (
            <Box key={period} sx={{ mb: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <Calendar size={18} color="#888" />
                <Typography sx={{ color: "#888", fontSize: "0.9rem", fontWeight: 600 }}>
                  {period}
                </Typography>
                <Chip
                  label={`${periodActivities.length} activities`}
                  size="small"
                  sx={{
                    bgcolor: "rgba(128, 128, 128, 0.15)",
                    color: "#888",
                    fontSize: "0.7rem",
                    height: "22px",
                  }}
                />
              </Box>
              
              <Grid container spacing={2}>
                {periodActivities.map((activity) => (
                  <Grid item xs={12} sm={6} md={6} key={activity.id}>
                    <Card
                      onClick={() => {
                        console.log('[ActivityList] ========== CARD CLICKED ==========');
                        console.log('[ActivityList] Clicked Activity:', activity);
                        console.log('[ActivityList] Activity ID:', activity.id);
                        console.log('[ActivityList] Activity Type:', activity.type);
                        console.log('[ActivityList] Navigating to:', `/activity/${activity.id}`);
                        
                        navigate(`/activity/${activity.id}`, { 
                          state: { activity }
                        });
                      }}
                      sx={{
                        bgcolor: "rgba(26, 26, 26, 0.4)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(128, 128, 128, 0.2)",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          borderColor: "rgba(138, 180, 248, 0.4)",
                          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                          bgcolor: "rgba(26, 26, 26, 0.6)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                          <Typography sx={{ color: "#ddd", fontWeight: 600, fontSize: "1rem" }}>
                            {activity.type || 'Unknown'}
                          </Typography>
                          <Chip
                            label={`${activity.calories || 0} cal`}
                            size="small"
                            icon={<Flame size={12} />}
                            sx={{
                              bgcolor: "rgba(255, 107, 107, 0.2)",
                              color: "#ff6b6b",
                              fontSize: "0.7rem",
                              height: "22px",
                              fontWeight: 600,
                              "& .MuiChip-icon": {
                                color: "#ff6b6b",
                              },
                            }}
                          />
                        </Box>

                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 2,
                            pt: 1.5,
                            borderTop: "1px solid rgba(128, 128, 128, 0.1)",
                          }}
                        >
                          <Box>
                            <Typography sx={{ color: "#666", fontSize: "0.7rem", mb: 0.5 }}>Duration</Typography>
                            <Typography sx={{ color: "#ddd", fontSize: "0.85rem", fontWeight: 600 }}>
                              {activity.duration || 0} min
                            </Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ color: "#666", fontSize: "0.7rem", mb: 0.5 }}>Distance</Typography>
                            <Typography sx={{ color: "#ddd", fontSize: "0.85rem", fontWeight: 600 }}>
                              {activity.additionalMetrics?.distance 
                                ? `${activity.additionalMetrics.distance} km` 
                                : "N/A"}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Debug Info */}
                        <Typography 
                          sx={{ 
                            color: "#444", 
                            fontSize: "0.6rem", 
                            mt: 1.5, 
                            fontFamily: "monospace",
                            textAlign: "center",
                            pt: 1,
                            borderTop: "1px solid rgba(128, 128, 128, 0.05)"
                          }}
                        >
                          ID: {activity.id}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}

          {activities.length === 0 && (
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                bgcolor: "rgba(26, 26, 26, 0.4)",
                borderRadius: "12px",
                border: "1px solid rgba(128, 128, 128, 0.2)",
              }}
            >
              <Activity size={64} color="#666" style={{ marginBottom: "16px" }} />
              <Typography sx={{ color: "#ddd", fontSize: "1.2rem", fontWeight: 600, mb: 1 }}>
                No Activities Yet
              </Typography>
              <Typography sx={{ color: "#888", fontSize: "0.9rem", mb: 3 }}>
                Start your fitness journey today
              </Typography>
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={() => navigate('/activity/new')}
                sx={{
                  bgcolor: "rgba(138, 180, 248, 0.2)",
                  color: "#8ab4f8",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  "&:hover": {
                    bgcolor: "rgba(138, 180, 248, 0.3)",
                  },
                }}
              >
                Add Your First Activity
              </Button>
            </Box>
          )}
        </Grid>

        {/* Right Side - Charts & Goals */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: "sticky", top: 24 }}>
            {/* Weekly Goal Card */}
            <Card
              sx={{
                bgcolor: "rgba(26, 26, 26, 0.6)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(128, 128, 128, 0.2)",
                borderRadius: "12px",
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "10px",
                        bgcolor: "rgba(138, 180, 248, 0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Target size={20} color="#8ab4f8" />
                    </Box>
                    <Box>
                      <Typography sx={{ color: "#ddd", fontSize: "1rem", fontWeight: 600 }}>
                        Weekly Goal
                      </Typography>
                      <Typography sx={{ color: "#666", fontSize: "0.8rem" }}>
                        {weeklyCalories} / {weeklyGoal} cal
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => setGoalDialogOpen(true)}
                    sx={{
                      color: "#888",
                      bgcolor: "rgba(128, 128, 128, 0.1)",
                      "&:hover": {
                        bgcolor: "rgba(128, 128, 128, 0.2)",
                      },
                    }}
                  >
                    <Edit2 size={16} />
                  </IconButton>
                </Box>

                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: 8,
                    borderRadius: 4,
                    bgcolor: "rgba(128, 128, 128, 0.2)",
                    overflow: "hidden",
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${Math.min(weeklyProgress, 100)}%`,
                      bgcolor: weeklyProgress >= 100 ? "#6bcf7f" : "#8ab4f8",
                      borderRadius: 4,
                      transition: "width 0.5s ease",
                    }}
                  />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ color: "#888", fontSize: "0.75rem" }}>
                    {weeklyProgress.toFixed(0)}% Complete
                  </Typography>
                  {weeklyProgress >= 100 && (
                    <Chip
                      label="Goal Reached!"
                      size="small"
                      sx={{
                        bgcolor: "rgba(107, 207, 127, 0.2)",
                        color: "#6bcf7f",
                        fontSize: "0.7rem",
                        height: "20px",
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Progress Chart */}
            <Card
              sx={{
                bgcolor: "rgba(26, 26, 26, 0.6)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(128, 128, 128, 0.2)",
                borderRadius: "12px",
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <TrendingUp size={20} color="#888" />
                  <Typography sx={{ color: "#ddd", fontSize: "1rem", fontWeight: 600 }}>
                    Weekly Progress
                  </Typography>
                </Box>

                <Box sx={{ height: 250 }}>
                  <Line data={chartData} options={chartOptions} />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    pt: 2,
                    mt: 2,
                    borderTop: "1px solid rgba(128, 128, 128, 0.1)",
                  }}
                >
                  <Box>
                    <Typography sx={{ color: "#666", fontSize: "0.7rem", mb: 0.5 }}>
                      Avg. Daily
                    </Typography>
                    <Typography sx={{ color: "#ddd", fontSize: "1.1rem", fontWeight: 700 }}>
                      {(weeklyCalories / 7).toFixed(0)} cal
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ color: "#666", fontSize: "0.7rem", mb: 0.5 }}>
                      Peak Day
                    </Typography>
                    <Typography sx={{ color: "#ddd", fontSize: "1.1rem", fontWeight: 700 }}>
                      {Math.max(...weeklyData.map(d => d.calories))} cal
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card
              sx={{
                bgcolor: "rgba(26, 26, 26, 0.6)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(128, 128, 128, 0.2)",
                borderRadius: "12px",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography sx={{ color: "#ddd", fontSize: "1rem", fontWeight: 600, mb: 2.5 }}>
                  This Week
                </Typography>
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ color: "#666", fontSize: "0.85rem" }}>Total Workouts</Typography>
                    <Typography sx={{ color: "#ddd", fontSize: "0.9rem", fontWeight: 600 }}>
                      {weeklyData.reduce((sum, d) => sum + d.count, 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ color: "#666", fontSize: "0.85rem" }}>Active Days</Typography>
                    <Typography sx={{ color: "#ddd", fontSize: "0.9rem", fontWeight: 600 }}>
                      {weeklyData.filter(d => d.count > 0).length} / 7
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ color: "#666", fontSize: "0.85rem" }}>Streak</Typography>
                    <Typography sx={{ color: "#ddd", fontSize: "0.9rem", fontWeight: 600 }}>
                      {weeklyData.filter(d => d.count > 0).length} days
                    </Typography>
                  </Box>
                </Box>

                <Button
                  fullWidth
                  endIcon={<ChevronRight size={18} />}
                  sx={{
                    mt: 3,
                    color: "#888",
                    textTransform: "none",
                    justifyContent: "space-between",
                    "&:hover": {
                      bgcolor: "rgba(128, 128, 128, 0.1)",
                    },
                  }}
                  onClick={() => navigate("/recommendations")}
                >
                  View Insights
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Edit Goal Dialog */}
      <Dialog 
        open={goalDialogOpen} 
        onClose={() => setGoalDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "rgba(26, 26, 26, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(128, 128, 128, 0.2)",
            borderRadius: "12px",
            minWidth: 400,
          }
        }}
      >
        <DialogTitle sx={{ color: "#ddd", borderBottom: "1px solid rgba(128, 128, 128, 0.1)" }}>
          Set Weekly Calorie Goal
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            type="number"
            label="Weekly Goal (calories)"
            value={tempGoal}
            onChange={(e) => setTempGoal(parseInt(e.target.value) || 0)}
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#ddd",
                "& fieldset": {
                  borderColor: "rgba(128, 128, 128, 0.3)",
                },
                "&:hover fieldset": {
                  borderColor: "rgba(128, 128, 128, 0.5)",
                },
              },
              "& .MuiInputLabel-root": {
                color: "#888",
              },
            }}
          />
          <Typography sx={{ color: "#666", fontSize: "0.85rem", mt: 2 }}>
            Recommended: 2000-3500 calories per week
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: "1px solid rgba(128, 128, 128, 0.1)" }}>
          <Button 
            onClick={() => setGoalDialogOpen(false)}
            sx={{ color: "#888", textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveGoal}
            variant="contained"
            sx={{
              bgcolor: "rgba(138, 180, 248, 0.2)",
              color: "#8ab4f8",
              textTransform: "none",
              "&:hover": {
                bgcolor: "rgba(138, 180, 248, 0.3)",
              },
            }}
          >
            Save Goal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ActivityList;