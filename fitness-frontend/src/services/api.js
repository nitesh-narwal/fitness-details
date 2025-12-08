import axios from "axios";

/**
 * Get authentication token from storage
 */
const getToken = () => {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
};

const getUserId = () => {
  return localStorage.getItem('userId');
};

/**
 * Create axios instance - Single Gateway endpoint
 * All microservices are accessed through API Gateway (port 8084)
 */
const apiClient = axios.create({
  baseURL: 'http://localhost:8084',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/**
 * Request Interceptor - Add JWT token to all requests
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    const userId = getUserId();
    
    console.log('[API Request]', config.method?.toUpperCase(), config.url, {
      hasToken: !!token,
      hasUserId: !!userId
    });

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (userId) {
      config.headers['X-User-Id'] = userId;
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor - Handle common errors
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log('[API Response]', response.config.method?.toUpperCase(), response.config.url, {
      status: response.status,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
    });
    return response;
  },
  (error) => {
    console.error('[API Error]', error.config?.method?.toUpperCase(), error.config?.url, {
      status: error.response?.status,
      message: error.message
    });
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      console.warn('[API] Unauthorized - Token may be expired');
    } else if (error.response?.status === 403) {
      console.warn('[API] Forbidden - Access denied');
    } else if (error.response?.status === 404) {
      console.warn('[API] Not found');
    } else if (error.response?.status >= 500) {
      console.error('[API] Server error');
    }
    
    return Promise.reject(error);
  }
);

// ==================== ACTIVITY ENDPOINTS ====================

/**
 * Get all activities for the current user
 */
export const getAllActivities = async () => {
  console.log('[Activity API] Fetching all activities via gateway...');
  const response = await apiClient.get('/api/activities');
  console.log('[Activity API] Success:', {
    count: response.data?.length || 0,
    data: response.data
  });
  return response;
};

// Alias for backward compatibility
export const getActivities = getAllActivities;

/**
 * Get a specific activity by ID
 */
export const getActivityById = async (id) => {
  console.log(`[Activity API] Fetching activity ${id} via gateway...`);
  const response = await apiClient.get(`/api/activities/${id}`);
  console.log('[Activity API] Activity details:', response.data);
  return response;
};

/**
 * Create a new activity
 */
export const createActivity = async (activityData) => {
  console.log('[Activity API] Creating activity via gateway:', activityData);
  const response = await apiClient.post('/api/activities', activityData);
  console.log('[Activity API] Activity created:', response.data);
  return response;
};

// Aliases for backward compatibility
export const addActivity = createActivity;
export const addActivities = createActivity;

/**
 * Update an existing activity
 */
export const updateActivity = async (id, activityData) => {
  console.log(`[Activity API] Updating activity ${id} via gateway:`, activityData);
  const response = await apiClient.put(`/api/activities/${id}`, activityData);
  console.log('[Activity API] Activity updated:', response.data);
  return response;
};


/**
 * Delete an activity
 
export const deleteActivity = async (id) => {
  console.log(`[Activity API] Deleting activity ${id} via gateway...`);
  const response = await apiClient.delete(`/api/activities/${id}`);
  console.log('[Activity API] Activity deleted');
  return response;
};
*/
export const deleteActivity = async (activityId) => {
  const response = await apiClient.delete(`/api/activities/${activityId}`);
  return response.data;
};


/**
 * Get weekly statistics
 */
export const getWeeklyStats = async () => {
  console.log('[Stats API] Fetching weekly stats via gateway...');
  const response = await apiClient.get('/api/activities/stats/weekly');
  console.log('[Stats API] Weekly stats:', response.data);
  return response;
};

// ==================== AI/RECOMMENDATION ENDPOINTS ====================
// ⭐ FIXED: Changed from /api/ai/recommendations to /api/recommendations
// This matches your API Gateway route: Path=/api/recommendations/**

/**
 * Generate fresh AI insights for a specific activity
 * Returns: recommendations, improvements, suggestions, safety tips
 * 
 * ⭐ ENDPOINT: /api/recommendations/activity/{activityId}
 * This is routed by API Gateway to AI-SERVICE
 */
export const generateAIInsights = async (activityId) => {
  console.log(`[AI API] 🤖 ========== GENERATING AI INSIGHTS ==========`);
  console.log(`[AI API] Activity ID: ${activityId}`);
  console.log(`[AI API] ⭐ CORRECTED Endpoint: GET /api/recommendations/activity/${activityId}`);
  console.log(`[AI API] Gateway will route to: AI-SERVICE`);
  
  try {
    // ⭐ FIXED: Changed from /api/ai/recommendations to /api/recommendations
    const response = await apiClient.get(`/api/recommendations/activity/${activityId}`, {
      timeout: 30000, // 30 seconds for AI processing
    });
    
    console.log('[AI API] ✅ AI Insights Response Status:', response.status);
    console.log('[AI API] ✅ AI Insights Raw Data:', response.data);
    console.log('[AI API] ✅ Response Structure:', {
      hasRecommendations: !!response.data?.recommendations,
      hasImprovements: !!response.data?.improvements,
      hasSuggestions: !!response.data?.suggestions,
      hasSafetyTips: !!response.data?.safetyTips,
      allKeys: Object.keys(response.data || {})
    });
    
    return response;
  } catch (error) {
    console.error('[AI API] ❌ ========== AI INSIGHTS ERROR ==========');
    console.error('[AI API] Error Status:', error.response?.status);
    console.error('[AI API] Error Message:', error.message);
    console.error('[AI API] Error Code:', error.code);
    console.error('[AI API] Error Data:', error.response?.data);
    console.error('[AI API] Full Error:', error);
    throw error;
  }
};

/**
 * Get all stored recommendations from MongoDB
 * 
 * ⭐ ENDPOINT: /api/recommendations
 * This is routed by API Gateway to AI-SERVICE
 */
export const getAllRecommendations = async () => {
  console.log('[Recommendation API] Fetching all stored recommendations via gateway...');
  console.log('[Recommendation API] ⭐ Endpoint: GET /api/recommendations');
  
  try {
    // ⭐ FIXED: Using /api/recommendations instead of /api/ai/recommendations
    const response = await apiClient.get('/api/recommendations');
    console.log('[Recommendation API] All recommendations:', response.data);
    return response;
  } catch (error) {
    console.error('[Recommendation API] Error:', error);
    throw error;
  }
};

// Alias for backward compatibility
export const getRecommendations = getAllRecommendations;

/**
 * Get stored recommendations for a specific activity from MongoDB
 * 
 * ⭐ ENDPOINT: /api/recommendations/activity/{activityId}
 * This is the SAME endpoint as generateAIInsights but may return cached data
 */
export const getActivityRecommendations = async (activityId) => {
  console.log(`[Recommendation API] Fetching stored recommendations for activity ${activityId}...`);
  console.log(`[Recommendation API] ⭐ Endpoint: GET /api/recommendations/activity/${activityId}`);
  
  try {
    const response = await apiClient.get(`/api/recommendations/activity/${activityId}`);
    console.log('[Recommendation API] Stored recommendations:', response.data);
    return response;
  } catch (error) {
    console.error('[Recommendation API] Error:', error);
    throw error;
  }
};

/**
 * Get general AI recommendations (not activity-specific)
 * 
 * ⭐ ENDPOINT: /api/recommendations/general
 */
export const getGeneralRecommendations = async () => {
  console.log('[AI API] 🤖 Fetching general AI recommendations...');
  console.log('[AI API] ⭐ Endpoint: GET /api/recommendations/general');
  
  try {
    const response = await apiClient.get('/api/recommendations/general', {
      timeout: 30000,
    });
    
    console.log('[AI API] ✅ General recommendations received:', response.data);
    return response;
  } catch (error) {
    console.error('[AI API] ❌ Failed to get general recommendations:', error);
    throw error;
  }
};

// ==================== MOCK DATA FALLBACK (Optional) ====================

/**
 * Generate mock AI insights as fallback when service is unavailable
 */
const generateMockAIInsights = (activityType = 'WORKOUT', duration = 30, calories = 200) => {
  console.log('[AI API] 🔄 Generating mock AI insights as fallback...');
  
  const mockInsights = {
    recommendations: [
      `Great ${activityType.toLowerCase()} session! Consider maintaining this intensity for optimal results.`,
      `Your ${duration} minute workout burned ${calories} calories, which is excellent progress.`,
      `Try to maintain consistency with ${activityType.toLowerCase()} workouts 3-4 times per week.`
    ],
    improvements: [
      `Gradually increase your workout duration by 5-10% each week for progressive overload.`,
      `Focus on proper form and technique to maximize benefits and prevent injuries.`,
      `Consider tracking your heart rate to ensure you're training in the optimal zone.`
    ],
    suggestions: [
      `Complement this activity with strength training for balanced fitness.`,
      `Stay hydrated before, during, and after your ${activityType.toLowerCase()} sessions.`,
      `Allow adequate recovery time between intense workouts.`
    ],
    safetyTips: [
      `Always warm up for 5-10 minutes before starting your main workout.`,
      `Listen to your body and stop if you feel any sharp pain or discomfort.`,
      `Cool down properly and stretch after your workout to prevent soreness.`,
      `Ensure proper nutrition and rest for optimal recovery.`
    ]
  };

  return {
    data: mockInsights,
    status: 200,
    isMock: true
  };
};

/**
 * Generate AI insights with automatic fallback to mock data
 * Use this for development when AI service might not be available
 */
export const generateAIInsightsWithFallback = async (activityId) => {
  try {
    return await generateAIInsights(activityId);
  } catch (error) {
    // If service is unavailable, return mock data
    if (error.response?.status === 404 || 
        error.response?.status === 503 || 
        error.code === 'ECONNREFUSED' ||
        error.message.includes('Network Error')) {
      
      console.warn('[AI API] ⚠️ AI Service unavailable, using mock data fallback');
      
      // Try to fetch activity details for better mock data
      try {
        const activityResponse = await apiClient.get(`/api/activities/${activityId}`);
        const activity = activityResponse.data;
        
        return generateMockAIInsights(
          activity.type || 'WORKOUT',
          activity.duration || 30,
          activity.calories || 200
        );
      } catch (activityError) {
        return generateMockAIInsights('WORKOUT', 30, 200);
      }
    }
    
    throw error;
  }
};

export default apiClient;