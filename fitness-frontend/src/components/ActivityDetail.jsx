import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Button,
  Grid,
  Divider,
  Alert,
  Skeleton,
} from "@mui/material";
import {
  Activity,
  Clock,
  Flame,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  ArrowLeft,
  Lightbulb,
  TrendingUp,
  Target,
  AlertTriangle,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { AuthContext } from "react-oauth2-code-pkce";
import { getActivityById, generateAIInsights, deleteActivity } from "../services/api";

function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useContext(AuthContext);

  const [activity, setActivity] = useState(location.state?.activity || null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(!location.state?.activity);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  console.log('[ActivityDetail] ========================================');
  console.log('[ActivityDetail] 🚀 COMPONENT RENDERED');
  console.log('[ActivityDetail] URL Param ID:', id);
  console.log('[ActivityDetail] Has Token:', !!token);
  console.log('[ActivityDetail] Location State Activity:', location.state?.activity);
  console.log('[ActivityDetail] Current Activity State:', activity);

  // Fetch activity details if not passed via state
  useEffect(() => {
    const fetchActivity = async () => {
      if (activity || !token) {
        console.log('[ActivityDetail] Skipping fetch - activity exists or no token');
        return;
      }

      console.log('[ActivityDetail] ========== FETCHING ACTIVITY DETAILS ==========');
      console.log('[ActivityDetail] Activity ID:', id);
      setLoading(true);
      setError(null);

      try {
        const response = await getActivityById(id);
        console.log('[ActivityDetail] ✅ Activity fetched:', response.data);
        setActivity(response.data);
      } catch (error) {
        console.error('[ActivityDetail] ❌ Error fetching activity:', error);
        setError(error.response?.data?.message || 'Failed to load activity');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id, token, activity]);

  // Enhanced AI insights parsing function
  const parseAIInsights = (responseData) => {
    console.log('[ActivityDetail] 🔍 ========== PARSING AI INSIGHTS ==========');
    console.log('[ActivityDetail] Raw Response Data:', responseData);
    console.log('[ActivityDetail] Response Type:', typeof responseData);
    console.log('[ActivityDetail] Response Keys:', Object.keys(responseData || {}));

    const insights = {
      recommendations: [],
      improvements: [],
      suggestions: [],
      safetyTips: [],
    };

    if (!responseData) {
      console.warn('[ActivityDetail] No response data to parse');
      return insights;
    }

    // Helper function to extract array from various formats
    const extractArray = (data, ...possibleKeys) => {
      for (const key of possibleKeys) {
        const value = data[key];
        if (Array.isArray(value) && value.length > 0) {
          console.log(`[ActivityDetail] ✅ Found array for key '${key}':`, value);
          return value;
        }
      }
      return [];
    };

    // Helper function to convert string to array if needed
    const ensureArray = (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return [value];
      if (value && typeof value === 'object') return [JSON.stringify(value)];
      return [];
    };

    // Try multiple parsing strategies
    try {
      // Strategy 1: Direct properties
      insights.recommendations = extractArray(
        responseData,
        'recommendations',
        'recommendation',
        'Recommendations',
        'recs'
      );

      insights.improvements = extractArray(
        responseData,
        'improvements',
        'improvement',
        'Improvements',
        'improve'
      );

      insights.suggestions = extractArray(
        responseData,
        'suggestions',
        'suggestion',
        'Suggestions',
        'suggest'
      );

      insights.safetyTips = extractArray(
        responseData,
        'safetyTips',
        'safety_tips',
        'safetyTip',
        'safety',
        'Safety',
        'SafetyTips'
      );

      // Strategy 2: Check nested 'data' property
      if (responseData.data) {
        console.log('[ActivityDetail] 🔍 Found nested data property:', responseData.data);
        
        insights.recommendations = insights.recommendations.length > 0 ? insights.recommendations : 
          extractArray(responseData.data, 'recommendations', 'recommendation');
        
        insights.improvements = insights.improvements.length > 0 ? insights.improvements : 
          extractArray(responseData.data, 'improvements', 'improvement');
        
        insights.suggestions = insights.suggestions.length > 0 ? insights.suggestions : 
          extractArray(responseData.data, 'suggestions', 'suggestion');
        
        insights.safetyTips = insights.safetyTips.length > 0 ? insights.safetyTips : 
          extractArray(responseData.data, 'safetyTips', 'safety_tips', 'safety');
      }

      // Strategy 3: Check if responseData itself is an array
      if (Array.isArray(responseData)) {
        console.log('[ActivityDetail] 🔍 Response is an array, processing items...');
        responseData.forEach(item => {
          if (item.type || item.category) {
            const category = (item.type || item.category).toLowerCase();
            const content = item.content || item.message || item.text || item.recommendation;
            
            if (category.includes('recommend')) {
              insights.recommendations.push(content);
            } else if (category.includes('improve')) {
              insights.improvements.push(content);
            } else if (category.includes('suggest')) {
              insights.suggestions.push(content);
            } else if (category.includes('safety')) {
              insights.safetyTips.push(content);
            }
          }
        });
      }

      // Strategy 4: Check for 'items' or 'results' property
      const containerKeys = ['items', 'results', 'insights', 'data'];
      for (const key of containerKeys) {
        if (Array.isArray(responseData[key])) {
          console.log(`[ActivityDetail] 🔍 Found array in '${key}' property:`, responseData[key]);
          responseData[key].forEach(item => {
            const category = (item.type || item.category || '').toLowerCase();
            const content = item.content || item.message || item.text || item;
            
            if (category.includes('recommend') || category === 'recommendation') {
              insights.recommendations.push(content);
            } else if (category.includes('improve') || category === 'improvement') {
              insights.improvements.push(content);
            } else if (category.includes('suggest') || category === 'suggestion') {
              insights.suggestions.push(content);
            } else if (category.includes('safety') || category === 'safety_tip') {
              insights.safetyTips.push(content);
            }
          });
        }
      }

      // Ensure all values are arrays
      insights.recommendations = ensureArray(insights.recommendations).flat();
      insights.improvements = ensureArray(insights.improvements).flat();
      insights.suggestions = ensureArray(insights.suggestions).flat();
      insights.safetyTips = ensureArray(insights.safetyTips).flat();

    } catch (parseError) {
      console.error('[ActivityDetail] ❌ Error parsing insights:', parseError);
    }

    console.log('[ActivityDetail] ✅ ========== PARSED INSIGHTS SUMMARY ==========');
    console.log('[ActivityDetail] Recommendations:', insights.recommendations.length, insights.recommendations);
    console.log('[ActivityDetail] Improvements:', insights.improvements.length, insights.improvements);
    console.log('[ActivityDetail] Suggestions:', insights.suggestions.length, insights.suggestions);
    console.log('[ActivityDetail] Safety Tips:', insights.safetyTips.length, insights.safetyTips);

    return insights;
  };

  // Fetch AI insights with enhanced parsing
  useEffect(() => {
    const fetchAIInsights = async () => {
      if (!activity || !token) {
        console.log('[ActivityDetail] Skipping AI fetch - no activity or token');
        return;
      }

      console.log('[ActivityDetail] 🤖 ========== ATTEMPTING TO FETCH AI INSIGHTS ==========');
      console.log('[ActivityDetail] Activity ID:', activity.id);
      console.log('[ActivityDetail] Activity Type:', activity.type);
      console.log('[ActivityDetail] Activity Duration:', activity.duration);
      console.log('[ActivityDetail] Activity Calories:', activity.calories);

      setLoadingAI(true);
      setAiError(null);

      try {
        const response = await generateAIInsights(activity.id);
        
        console.log('[ActivityDetail] ✅ ========== AI INSIGHTS SUCCESS ==========');
        console.log('[ActivityDetail] Response Status:', response.status);
        console.log('[ActivityDetail] Response Data Type:', typeof response.data);
        console.log('[ActivityDetail] Response Data:', response.data);
        console.log('[ActivityDetail] Response Data Keys:', Object.keys(response.data || {}));

        // Parse the response with enhanced parsing
        const parsedInsights = parseAIInsights(response.data);
        setAiInsights(parsedInsights);

        // Check if we got any insights
        const totalInsights = 
          parsedInsights.recommendations.length +
          parsedInsights.improvements.length +
          parsedInsights.suggestions.length +
          parsedInsights.safetyTips.length;

        if (totalInsights === 0) {
          console.warn('[ActivityDetail] ⚠️ No insights were parsed from response');
          setAiError('AI service returned data but no insights could be extracted. Please check the response format.');
        }

      } catch (error) {
        console.error('[ActivityDetail] ❌ ========== AI INSIGHTS ERROR ==========');
        console.error('[ActivityDetail] Error Object:', error);
        console.error('[ActivityDetail] Error Status:', error.response?.status);
        console.error('[ActivityDetail] Error Data:', error.response?.data);
        console.error('[ActivityDetail] Error Message:', error.message);
        console.error('[ActivityDetail] Error Code:', error.code);

        if (error.response?.status === 404) {
          setAiError('AI service endpoint not found. Please verify the AI microservice is running and properly configured in the API Gateway.');
        } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          setAiError('Cannot connect to AI service. Please ensure the AI microservice is running.');
        } else if (error.response?.status === 500) {
          setAiError('AI service encountered an internal error. Please try again later.');
        } else if (error.response?.status === 503) {
          setAiError('AI service is temporarily unavailable. Please try again in a moment.');
        } else {
          setAiError(error.response?.data?.message || error.message || 'Failed to generate AI insights');
        }
      } finally {
        setLoadingAI(false);
        console.log('[ActivityDetail] ========== AI FETCH COMPLETE ==========');
      }
    };

    const timer = setTimeout(() => {
      fetchAIInsights();
    }, 500);

    return () => clearTimeout(timer);
  }, [activity, token]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    console.log('[ActivityDetail] 🗑️ Deleting activity:', id);
    setDeleteLoading(true);

    try {
      await deleteActivity(id);
      console.log('[ActivityDetail] ✅ Activity deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('[ActivityDetail] ❌ Error deleting activity:', error);
      alert('Failed to delete activity: ' + (error.message || 'Unknown error'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = () => {
    console.log('[ActivityDetail] ✏️ Navigating to edit:', id);
    navigate(`/activity/edit/${id}`, { state: { activity } });
  };

  const renderInsightSection = (title, items, icon, color) => {
    // Filter out empty or invalid items
    const validItems = (items || []).filter(item => {
      if (typeof item === 'string') return item.trim().length > 0;
      if (typeof item === 'object') return item !== null;
      return false;
    });

    if (validItems.length === 0) {
      console.log(`[ActivityDetail] No valid items for section: ${title}`);
      return null;
    }

    console.log(`[ActivityDetail] Rendering section '${title}' with ${validItems.length} items`);

    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "8px",
              bgcolor: `${color}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: color,
            }}
          >
            {icon}
          </Box>
          <Typography sx={{ color: "#ddd", fontSize: "1rem", fontWeight: 600 }}>
            {title}
          </Typography>
          <Chip
            label={validItems.length}
            size="small"
            sx={{
              bgcolor: `${color}20`,
              color: color,
              fontSize: "0.7rem",
              height: "20px",
              fontWeight: 600,
            }}
          />
        </Box>
        <Grid container spacing={2}>
          {validItems.map((item, index) => {
            // Extract text from various formats
            let text = '';
            if (typeof item === 'string') {
              text = item;
            } else if (item && typeof item === 'object') {
              text = item.message || 
                     item.text || 
                     item.content ||
                     item.description || 
                     item.recommendation ||
                     JSON.stringify(item);
            } else {
              text = String(item);
            }

            // Skip empty texts
            if (!text || text.trim().length === 0) {
              return null;
            }

            return (
              <Grid item xs={12} key={`${title}-${index}`}>
                <Box
                  sx={{
                    bgcolor: "rgba(18, 18, 18, 0.6)",
                    borderRadius: "8px",
                    border: `1px solid ${color}30`,
                    p: 2,
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      bgcolor: "rgba(18, 18, 18, 0.8)",
                      borderColor: `${color}50`,
                      transform: "translateX(2px)",
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: "3px",
                      bgcolor: color,
                    }
                  }}
                >
                  <Typography sx={{ 
                    color: "#aaa", 
                    fontSize: "0.9rem", 
                    lineHeight: 1.6,
                    pl: 2,
                  }}>
                    {text}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
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
          Loading activity details...
        </Typography>
      </Box>
    );
  }

  if (error || !activity) {
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
          {error || 'Activity not found'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowLeft size={18} />}
          onClick={() => navigate('/dashboard')}
          sx={{
            bgcolor: "rgba(138, 180, 248, 0.2)",
            color: "#8ab4f8",
            textTransform: "none",
            "&:hover": { bgcolor: "rgba(138, 180, 248, 0.3)" }
          }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  const activityDate = new Date(activity.activityDate || activity.createdAt);
  const formattedDate = activityDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Box sx={{ maxWidth: 1200, margin: "0 auto", px: { xs: 2, sm: 3 }, py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowLeft size={18} />}
          onClick={() => navigate('/dashboard')}
          sx={{
            color: "#888",
            textTransform: "none",
            mb: 2,
            "&:hover": { color: "#aaa", bgcolor: "transparent" },
          }}
        >
          Back to Activities
        </Button>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: "#ddd",
                fontWeight: 700,
                letterSpacing: "-0.5px",
                mb: 0.5,
              }}
            >
              {activity.type}
            </Typography>
            <Typography sx={{ color: "#888", fontSize: "0.95rem" }}>
              {formattedDate}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Edit2 size={18} />}
              onClick={handleEdit}
              sx={{
                color: "#8ab4f8",
                borderColor: "rgba(138, 180, 248, 0.3)",
                textTransform: "none",
                "&:hover": {
                  borderColor: "rgba(138, 180, 248, 0.5)",
                  bgcolor: "rgba(138, 180, 248, 0.1)",
                },
              }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              startIcon={deleteLoading ? <CircularProgress size={16} /> : <Trash2 size={18} />}
              onClick={handleDelete}
              disabled={deleteLoading}
              sx={{
                color: "#ff6b6b",
                borderColor: "rgba(255, 107, 107, 0.3)",
                textTransform: "none",
                "&:hover": {
                  borderColor: "rgba(255, 107, 107, 0.5)",
                  bgcolor: "rgba(255, 107, 107, 0.1)",
                },
                "&:disabled": {
                  borderColor: "rgba(128, 128, 128, 0.2)",
                  color: "#666",
                },
              }}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Activity Stats Card */}
        <Grid item xs={12} md={5}>
          <Card
            sx={{
              bgcolor: "rgba(26, 26, 26, 0.6)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(128, 128, 128, 0.2)",
              borderRadius: "12px",
              height: "100%",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ color: "#ddd", fontSize: "1.1rem", fontWeight: 600, mb: 3 }}>
                Activity Details
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Box
                    sx={{
                      bgcolor: "rgba(255, 217, 61, 0.1)",
                      borderRadius: "10px",
                      p: 2.5,
                      border: "1px solid rgba(255, 217, 61, 0.2)",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                      <Clock size={20} color="#ffd93d" />
                      <Typography sx={{ color: "#888", fontSize: "0.8rem" }}>Duration</Typography>
                    </Box>
                    <Typography sx={{ color: "#ddd", fontSize: "1.8rem", fontWeight: 700 }}>
                      {activity.duration}
                      <Typography component="span" sx={{ fontSize: "0.9rem", color: "#888", ml: 0.5 }}>
                        min
                      </Typography>
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box
                    sx={{
                      bgcolor: "rgba(255, 107, 107, 0.1)",
                      borderRadius: "10px",
                      p: 2.5,
                      border: "1px solid rgba(255, 107, 107, 0.2)",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                      <Flame size={20} color="#ff6b6b" />
                      <Typography sx={{ color: "#888", fontSize: "0.8rem" }}>Calories</Typography>
                    </Box>
                    <Typography sx={{ color: "#ddd", fontSize: "1.8rem", fontWeight: 700 }}>
                      {activity.calories}
                      <Typography component="span" sx={{ fontSize: "0.9rem", color: "#888", ml: 0.5 }}>
                        cal
                      </Typography>
                    </Typography>
                  </Box>
                </Grid>

                {activity.additionalMetrics?.distance && (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        bgcolor: "rgba(107, 207, 127, 0.1)",
                        borderRadius: "10px",
                        p: 2.5,
                        border: "1px solid rgba(107, 207, 127, 0.2)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                        <MapPin size={20} color="#6bcf7f" />
                        <Typography sx={{ color: "#888", fontSize: "0.8rem" }}>Distance</Typography>
                      </Box>
                      <Typography sx={{ color: "#ddd", fontSize: "1.8rem", fontWeight: 700 }}>
                        {activity.additionalMetrics.distance}
                        <Typography component="span" sx={{ fontSize: "0.9rem", color: "#888", ml: 0.5 }}>
                          km
                        </Typography>
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {activity.additionalMetrics?.notes && (
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        bgcolor: "rgba(138, 180, 248, 0.1)",
                        borderRadius: "10px",
                        p: 2.5,
                        border: "1px solid rgba(138, 180, 248, 0.2)",
                      }}
                    >
                      <Typography sx={{ color: "#888", fontSize: "0.8rem", mb: 1 }}>Notes</Typography>
                      <Typography sx={{ color: "#aaa", fontSize: "0.9rem", lineHeight: 1.6 }}>
                        {activity.additionalMetrics.notes}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Insights Card */}
        <Grid item xs={12} md={7}>
          <Card
            sx={{
              bgcolor: "rgba(26, 26, 26, 0.6)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(128, 128, 128, 0.2)",
              borderRadius: "12px",
              height: "100%",
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
                  <Sparkles size={20} color="#8ab4f8" />
                </Box>
                <Box>
                  <Typography sx={{ color: "#ddd", fontSize: "1.1rem", fontWeight: 600 }}>
                    AI Insights
                  </Typography>
                  <Typography sx={{ color: "#666", fontSize: "0.8rem" }}>
                    Powered by Claude AI
                  </Typography>
                </Box>
              </Box>

              {loadingAI && (
                <Box sx={{ py: 4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <CircularProgress size={20} sx={{ color: "#8ab4f8" }} />
                    <Typography sx={{ color: "#888", fontSize: "0.9rem" }}>
                      Generating AI insights...
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Skeleton variant="rectangular" height={60} sx={{ bgcolor: "rgba(128, 128, 128, 0.1)", borderRadius: "8px" }} />
                    <Skeleton variant="rectangular" height={60} sx={{ bgcolor: "rgba(128, 128, 128, 0.1)", borderRadius: "8px" }} />
                    <Skeleton variant="rectangular" height={60} sx={{ bgcolor: "rgba(128, 128, 128, 0.1)", borderRadius: "8px" }} />
                  </Box>
                </Box>
              )}

              {aiError && !loadingAI && (
                <Alert
                  severity="warning"
                  icon={<AlertCircle size={20} />}
                  sx={{
                    bgcolor: "rgba(255, 217, 61, 0.1)",
                    border: "1px solid rgba(255, 217, 61, 0.2)",
                    color: "#ffd93d",
                    "& .MuiAlert-icon": { color: "#ffd93d" },
                    mb: 2,
                  }}
                >
                  <Typography sx={{ fontSize: "0.85rem", mb: 1, fontWeight: 600 }}>
                    AI Service Issue
                  </Typography>
                  <Typography sx={{ fontSize: "0.8rem", color: "#999" }}>
                    {aiError}
                  </Typography>
                </Alert>
              )}

              {aiInsights && !loadingAI && (
                <Box>
                  {renderInsightSection(
                    "Recommendations",
                    aiInsights.recommendations,
                    <Lightbulb size={18} />,
                    "#8ab4f8"
                  )}
                  {renderInsightSection(
                    "Improvements",
                    aiInsights.improvements,
                    <TrendingUp size={18} />,
                    "#ffd93d"
                  )}
                  {renderInsightSection(
                    "Suggestions",
                    aiInsights.suggestions,
                    <Target size={18} />,
                    "#6bcf7f"
                  )}
                  {renderInsightSection(
                    "Safety Tips",
                    aiInsights.safetyTips,
                    <AlertTriangle size={18} />,
                    "#ff6b6b"
                  )}

                  {!aiInsights.recommendations?.length &&
                    !aiInsights.improvements?.length &&
                    !aiInsights.suggestions?.length &&
                    !aiInsights.safetyTips?.length && (
                      <Box sx={{ textAlign: "center", py: 4 }}>
                        <Sparkles size={48} color="#666" style={{ marginBottom: "12px" }} />
                        <Typography sx={{ color: "#888", fontSize: "0.9rem", mb: 1 }}>
                          No insights available
                        </Typography>
                        <Typography sx={{ color: "#666", fontSize: "0.75rem" }}>
                          The AI service returned data but it couldn't be parsed
                        </Typography>
                      </Box>
                    )}
                </Box>
              )}

              {!aiInsights && !loadingAI && !aiError && (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Sparkles size={48} color="#666" style={{ marginBottom: "12px" }} />
                  <Typography sx={{ color: "#888", fontSize: "0.9rem" }}>
                    AI insights will appear here once generated
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ActivityDetail;