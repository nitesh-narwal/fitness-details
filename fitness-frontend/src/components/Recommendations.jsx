import { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Grid,
  Alert,
  Button,
} from "@mui/material";
import {
  Lightbulb,
  TrendingUp,
  Target,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Activity,
} from "lucide-react";
import { AuthContext } from "react-oauth2-code-pkce";
import { getAllRecommendations, getGeneralRecommendations } from "../services/api";

function Recommendations() {
  const { token } = useContext(AuthContext);
  const [recommendations, setRecommendations] = useState([]);
  const [generalInsights, setGeneralInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [error, setError] = useState(null);

  console.log('[Recommendations] Component mounted');
  console.log('[Recommendations] Has Token:', !!token);

  // Fetch stored recommendations from MongoDB
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!token) {
        console.warn('[Recommendations] No token available');
        setLoading(false);
        setError('Please log in to view recommendations');
        return;
      }

      console.log('[Recommendations] ========== FETCHING STORED RECOMMENDATIONS ==========');
      setLoading(true);
      setError(null);

      try {
        const response = await getAllRecommendations();
        
        console.log('[Recommendations] Response:', response);
        console.log('[Recommendations] Response data:', response.data);
        
        const recsData = Array.isArray(response.data) 
          ? response.data 
          : response.data?.recommendations || [];
        
        setRecommendations(recsData);
        console.log('[Recommendations] ✅ Loaded:', recsData.length, 'recommendations');
        
      } catch (error) {
        console.error('[Recommendations] ❌ Error fetching recommendations:', error);
        console.error('[Recommendations] Error response:', error.response?.data);
        
        if (error.response?.status === 404) {
          setError('No recommendations found. Generate insights from your activities first!');
        } else {
          setError(error.response?.data?.message || error.message || 'Failed to load recommendations');
        }
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [token]);

  // Fetch general AI insights
  const handleGenerateGeneralInsights = async () => {
    console.log('[Recommendations] 🤖 Generating general insights...');
    setLoadingGeneral(true);

    try {
      const response = await getGeneralRecommendations();
      console.log('[Recommendations] ✅ General insights:', response.data);
      setGeneralInsights(response.data);
    } catch (error) {
      console.error('[Recommendations] ❌ Error generating general insights:', error);
      alert('Failed to generate insights: ' + (error.message || 'Unknown error'));
    } finally {
      setLoadingGeneral(false);
    }
  };

  // Group recommendations by activity
  const groupedRecommendations = recommendations.reduce((acc, rec) => {
    const activityId = rec.activityId || 'general';
    if (!acc[activityId]) {
      acc[activityId] = [];
    }
    acc[activityId].push(rec);
    return acc;
  }, {});

  // Render insight card
  const renderInsightCard = (insight, index, category) => {
    const categoryConfig = {
      recommendation: { icon: <Lightbulb size={20} />, color: "#8ab4f8", label: "Recommendation" },
      improvement: { icon: <TrendingUp size={20} />, color: "#ffd93d", label: "Improvement" },
      suggestion: { icon: <Sparkles size={20} />, color: "#6bcf7f", label: "Suggestion" },
      safety: { icon: <AlertTriangle size={20} />, color: "#ff6b6b", label: "Safety Tip" },
    };

    const config = categoryConfig[category] || categoryConfig.recommendation;
    const text = typeof insight === 'string' 
      ? insight 
      : insight.message || insight.text || insight.description || JSON.stringify(insight);

    return (
      <Grid item xs={12} key={`${category}-${index}`}>
        <Box
          sx={{
            bgcolor: "rgba(18, 18, 18, 0.6)",
            borderRadius: "8px",
            border: `1px solid ${config.color}30`,
            p: 2.5,
            transition: "all 0.3s ease",
            position: "relative",
            overflow: "hidden",
            "&:hover": {
              bgcolor: "rgba(18, 18, 18, 0.8)",
              borderColor: `${config.color}50`,
              transform: "translateX(2px)",
            },
            "&::before": {
              content: '""',
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "4px",
              bgcolor: config.color,
            }
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                bgcolor: `${config.color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: config.color,
              }}
            >
              {config.icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Chip
                label={config.label}
                size="small"
                sx={{
                  bgcolor: `${config.color}20`,
                  color: config.color,
                  fontSize: "0.7rem",
                  height: "22px",
                  fontWeight: 600,
                  mb: 1.5,
                }}
              />
              <Typography sx={{ 
                color: "#aaa", 
                fontSize: "0.9rem", 
                lineHeight: 1.6,
              }}>
                {text}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: "flex", 
        flexDirection: "column",
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "70vh",
        gap: 2
      }}>
        <CircularProgress sx={{ color: "#888" }} />
        <Typography sx={{ color: "#888", fontSize: "0.9rem" }}>
          Loading recommendations...
        </Typography>
      </Box>
    );
  }

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
        <Lightbulb size={64} color="#ff6b6b" />
        <Typography sx={{ color: "#ff6b6b", fontSize: "1.2rem", fontWeight: 600 }}>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
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

  return (
    <Box sx={{ maxWidth: 1400, margin: "0 auto", px: { xs: 2, sm: 3 }, py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            color: "#ddd",
            fontWeight: 700,
            letterSpacing: "-0.5px",
            mb: 1,
          }}
        >
          AI Recommendations
        </Typography>
        <Typography sx={{ color: "#888", fontSize: "0.95rem" }}>
          Personalized insights to improve your fitness journey
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* General Insights Card */}
        <Grid item xs={12}>
          <Card
            sx={{
              bgcolor: "rgba(26, 26, 26, 0.6)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(138, 180, 248, 0.3)",
              borderRadius: "12px",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "12px",
                      bgcolor: "rgba(138, 180, 248, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Sparkles size={24} color="#8ab4f8" />
                  </Box>
                  <Box>
                    <Typography sx={{ color: "#ddd", fontSize: "1.1rem", fontWeight: 600 }}>
                      General AI Insights
                    </Typography>
                    <Typography sx={{ color: "#666", fontSize: "0.85rem" }}>
                      Get personalized fitness recommendations
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  startIcon={loadingGeneral ? <CircularProgress size={16} sx={{ color: "#8ab4f8" }} /> : <RefreshCw size={18} />}
                  onClick={handleGenerateGeneralInsights}
                  disabled={loadingGeneral}
                  sx={{
                    bgcolor: "rgba(138, 180, 248, 0.2)",
                    color: "#8ab4f8",
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    "&:hover": {
                      bgcolor: "rgba(138, 180, 248, 0.3)",
                    },
                    "&:disabled": {
                      bgcolor: "rgba(128, 128, 128, 0.2)",
                      color: "#666",
                    },
                  }}
                >
                  {loadingGeneral ? "Generating..." : "Generate Insights"}
                </Button>
              </Box>

              {generalInsights && (
                <Alert
                  severity="info"
                  icon={<Lightbulb size={20} />}
                  sx={{
                    bgcolor: "rgba(138, 180, 248, 0.1)",
                    border: "1px solid rgba(138, 180, 248, 0.2)",
                    color: "#8ab4f8",
                    "& .MuiAlert-icon": { color: "#8ab4f8" }
                  }}
                >
                  <Typography sx={{ fontSize: "0.9rem" }}>
                    {typeof generalInsights === 'string' 
                      ? generalInsights 
                      : generalInsights.message || JSON.stringify(generalInsights)}
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Activity-Based Recommendations */}
        {Object.keys(groupedRecommendations).length > 0 ? (
          Object.entries(groupedRecommendations).map(([activityId, recs]) => (
            <Grid item xs={12} key={activityId}>
              <Card
                sx={{
                  bgcolor: "rgba(26, 26, 26, 0.6)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(128, 128, 128, 0.2)",
                  borderRadius: "12px",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
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
                      <Activity size={20} color="#8ab4f8" />
                    </Box>
                    <Box>
                      <Typography sx={{ color: "#ddd", fontSize: "1rem", fontWeight: 600 }}>
                        Activity: {activityId}
                      </Typography>
                      <Typography sx={{ color: "#666", fontSize: "0.8rem" }}>
                        {recs.length} insights available
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    {recs.map((rec, index) => {
                      // Determine category from recommendation object
                      const category = rec.category || rec.type || 'recommendation';
                      const content = rec.recommendation || rec.content || rec;
                      return renderInsightCard(content, index, category.toLowerCase());
                    })}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Box
              sx={{
                textAlign: "center",
                py: 8,
                bgcolor: "rgba(26, 26, 26, 0.4)",
                borderRadius: "12px",
                border: "1px dashed rgba(128, 128, 128, 0.3)",
              }}
            >
              <Lightbulb size={64} color="#666" style={{ marginBottom: "16px" }} />
              <Typography sx={{ color: "#ddd", fontSize: "1.2rem", fontWeight: 600, mb: 1 }}>
                No Recommendations Yet
              </Typography>
              <Typography sx={{ color: "#888", fontSize: "0.9rem", mb: 3 }}>
                View your activities to get AI-powered insights
              </Typography>
              <Button
                variant="contained"
                onClick={() => window.location.href = '/dashboard'}
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
                View Activities
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export default Recommendations;