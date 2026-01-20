import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  MenuItem,
  Grid,
  InputAdornment,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  Activity,
  Clock,
  Flame,
  Calendar,
  MapPin,
  Save,
  X,
} from "lucide-react";
import { AuthContext } from "react-oauth2-code-pkce";
import { createActivity } from "../services/api"; // ⭐ FIXED: Changed from addActivities to createActivity

function ActivityForm() {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    type: "",
    duration: "",
    calories: "",
    activityDate: new Date().toISOString().split("T")[0],
    distance: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const activityTypes = [
    "RUNNING",
    "CYCLING",
    "SWIMMING",
    "YOGA",
    "GYM",
    "WALKING",
    "HIKING",
    "WEIGHTLIFTING",
    "CARDIO",
    "STRETCHING",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("Please log in to create activities");
      return;
    }

    console.log('[ActivityForm] ========== SUBMITTING FORM ==========');
    console.log('[ActivityForm] Form Data:', formData);

    // Validation
    if (!formData.type || !formData.duration || !formData.calories) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare activity data
      const activityData = {
        type: formData.type,
        duration: parseInt(formData.duration),
        calories: parseInt(formData.calories),
        activityDate: formData.activityDate,
        additionalMetrics: {},
      };

      // Add optional fields
      if (formData.distance) {
        activityData.additionalMetrics.distance = parseFloat(formData.distance);
      }

      if (formData.notes) {
        activityData.additionalMetrics.notes = formData.notes;
      }

      console.log('[ActivityForm] Sending to API:', activityData);

      const response = await createActivity(activityData); // ⭐ Using createActivity

      console.log('[ActivityForm] ✅ Activity created:', response.data);

      setSuccessOpen(true);

      // Reset form
      setFormData({
        type: "",
        duration: "",
        calories: "",
        activityDate: new Date().toISOString().split("T")[0],
        distance: "",
        notes: "",
      });

      // Navigate back to dashboard after 1.5 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);

    } catch (error) {
      console.error('[ActivityForm] ❌ Error creating activity:', error);
      console.error('[ActivityForm] Error response:', error.response?.data);
      setError(error.response?.data?.message || error.message || "Failed to create activity");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('[ActivityForm] Cancelling form');
    navigate("/dashboard");
  };

  return (
    <Box sx={{ maxWidth: 800, margin: "0 auto", px: { xs: 2, sm: 3 }, py: 3 }}>
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
          New Activity
        </Typography>
        <Typography sx={{ color: "#888", fontSize: "0.95rem" }}>
          Track your fitness journey
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Card
          sx={{
            bgcolor: "rgba(26, 26, 26, 0.6)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(128, 128, 128, 0.2)",
            borderRadius: "12px",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3}>
              {/* Activity Type */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Activity Type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Activity size={20} color="#888" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#ddd",
                      "& fieldset": {
                        borderColor: "rgba(128, 128, 128, 0.3)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(128, 128, 128, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "rgba(138, 180, 248, 0.5)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#888",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#8ab4f8",
                    },
                  }}
                >
                  {activityTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Date"
                  name="activityDate"
                  value={formData.activityDate}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Calendar size={20} color="#888" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#ddd",
                      "& fieldset": {
                        borderColor: "rgba(128, 128, 128, 0.3)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(128, 128, 128, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "rgba(138, 180, 248, 0.5)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#888",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#8ab4f8",
                    },
                  }}
                />
              </Grid>

              {/* Duration */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Clock size={20} color="#888" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography sx={{ color: "#666", fontSize: "0.9rem" }}>
                          min
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#ddd",
                      "& fieldset": {
                        borderColor: "rgba(128, 128, 128, 0.3)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(128, 128, 128, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "rgba(138, 180, 248, 0.5)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#888",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#8ab4f8",
                    },
                  }}
                />
              </Grid>

              {/* Calories */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Calories Burned"
                  name="calories"
                  value={formData.calories}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Flame size={20} color="#888" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography sx={{ color: "#666", fontSize: "0.9rem" }}>
                          cal
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#ddd",
                      "& fieldset": {
                        borderColor: "rgba(128, 128, 128, 0.3)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(128, 128, 128, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "rgba(138, 180, 248, 0.5)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#888",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#8ab4f8",
                    },
                  }}
                />
              </Grid>

              {/* Distance (Optional) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Distance (Optional)"
                  name="distance"
                  value={formData.distance}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MapPin size={20} color="#888" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Typography sx={{ color: "#666", fontSize: "0.9rem" }}>
                          km
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#ddd",
                      "& fieldset": {
                        borderColor: "rgba(128, 128, 128, 0.3)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(128, 128, 128, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "rgba(138, 180, 248, 0.5)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#888",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#8ab4f8",
                    },
                  }}
                />
              </Grid>

              {/* Notes (Optional) */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Notes (Optional)"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any additional details about your activity..."
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#ddd",
                      "& fieldset": {
                        borderColor: "rgba(128, 128, 128, 0.3)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(128, 128, 128, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "rgba(138, 180, 248, 0.5)",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#888",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#8ab4f8",
                    },
                  }}
                />
              </Grid>

              {/* Error Alert */}
              {error && (
                <Grid item xs={12}>
                  <Alert
                    severity="error"
                    onClose={() => setError(null)}
                    sx={{
                      bgcolor: "rgba(255, 107, 107, 0.1)",
                      border: "1px solid rgba(255, 107, 107, 0.3)",
                      color: "#ff6b6b",
                      "& .MuiAlert-icon": {
                        color: "#ff6b6b",
                      },
                    }}
                  >
                    {error}
                  </Alert>
                </Grid>
              )}

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    justifyContent: "flex-end",
                    pt: 2,
                    borderTop: "1px solid rgba(128, 128, 128, 0.1)",
                  }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<X size={18} />}
                    onClick={handleCancel}
                    disabled={loading}
                    sx={{
                      color: "#888",
                      borderColor: "rgba(128, 128, 128, 0.3)",
                      textTransform: "none",
                      px: 3,
                      "&:hover": {
                        borderColor: "rgba(128, 128, 128, 0.5)",
                        bgcolor: "rgba(128, 128, 128, 0.1)",
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save size={18} />}
                    disabled={loading}
                    sx={{
                      bgcolor: "rgba(138, 180, 248, 0.2)",
                      color: "#8ab4f8",
                      textTransform: "none",
                      px: 3,
                      border: "1px solid rgba(138, 180, 248, 0.3)",
                      "&:hover": {
                        bgcolor: "rgba(138, 180, 248, 0.3)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(138, 180, 248, 0.3)",
                      },
                      "&:disabled": {
                        bgcolor: "rgba(128, 128, 128, 0.2)",
                        color: "#666",
                        borderColor: "rgba(128, 128, 128, 0.2)",
                      },
                    }}
                  >
                    {loading ? "Saving..." : "Save Activity"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </form>

      {/* Success Snackbar */}
      <Snackbar
        open={successOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessOpen(false)}
          severity="success"
          sx={{
            bgcolor: "rgba(107, 207, 127, 0.1)",
            border: "1px solid rgba(107, 207, 127, 0.3)",
            color: "#6bcf7f",
            "& .MuiAlert-icon": {
              color: "#6bcf7f",
            },
          }}
        >
          Activity created successfully! Redirecting...
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ActivityForm;