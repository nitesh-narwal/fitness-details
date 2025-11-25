package com.fitness.aiservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fitness.aiservice.model.Activity;
import com.fitness.aiservice.model.Recommendation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
@AllArgsConstructor
public class ActivityAIService {
    private final GeminiService geminiService;

    public Recommendation generateRecommendation(Activity activity) {
        String prompt = createPromptForActivity(activity);
        String aiResponse = geminiService.getRecommendations(prompt);
        log.info("RESPONSE FROM AI {}", aiResponse);


        return processAIResponse(activity, aiResponse);
    }

    private Recommendation processAIResponse(Activity activity, String aiResponse) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(aiResponse);
            JsonNode textNode = rootNode.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text");

            String jsonContent = textNode.asText()
                    .replaceAll("```json\\n", "")
                    .replaceAll("\\n```", "")
                    .trim();

           // log.info("RESPONSE FROM AI {}", jsonContent);

            JsonNode analysisJson = mapper.readTree(jsonContent);
            JsonNode analysisNode = analysisJson.path("analysis");
            StringBuilder fullAnalysis = new StringBuilder();
            addAnalysisSection(fullAnalysis, analysisNode, "overall", "Overall: ");
            addAnalysisSection(fullAnalysis, analysisNode, "pace", "Pace: ");
            addAnalysisSection(fullAnalysis, analysisNode, "heartRate", "Heart Rate: ");
            addAnalysisSection(fullAnalysis, analysisNode, "caloriesBurned", "Calories Burned: ");

            List<String> improvements = extractImprovements(analysisJson.path("improvements"));
            List<String> suggestions = extractSuggestions(analysisJson.path("suggestions"));
            List<String> safety = extractSafetyGuidlines(analysisJson.path("safety"));

            return  Recommendation.builder()
                    .activityId(activity.getId())
                    .userId(activity.getUserId())
                    .type(activity.getType().toString())
                    .recommendation(fullAnalysis.toString().trim())
                    .improvements(improvements)
                    .suggestions(suggestions)
                    .saftey(safety)
                    .createdAt(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            //e.printStackTrace();
            log.error("Error processing AI response: {}", e.getMessage(), e);
            return createDefaultRecommendation(activity);
        }
    }

    private Recommendation createDefaultRecommendation(Activity activity) {
        return Recommendation.builder()
                .activityId(activity.getId())
                .userId(activity.getUserId())
                .type(activity.getType().toString())
                .recommendation("Unable to generate full analysis")
                .improvements(Collections.singletonList("Continue with your current routine"))
                .suggestions(Collections.singletonList("Consider consulting a fitness Consultant"))
                .saftey(Arrays.asList(
                        "Always warm up before starting a workout",
                        "Stay hydrated",
                        "Listen to your body"))
                .createdAt(LocalDateTime.now())
                .build();
    }

    private List<String> extractSafetyGuidlines(JsonNode safetyNode) {
        List<String> safety = new ArrayList<>();
        if(safetyNode.isArray()){
            safetyNode.forEach(item -> safety.add(item.asText()));
        }
        return safety.isEmpty() ?
                Collections.singletonList("Follow general guidlines Provided") :
                safety;

    }

    private List<String> extractSuggestions(JsonNode suggestionsNode) {
        List<String> suggestions = new ArrayList<>();
        if(suggestionsNode.isArray()){
            suggestionsNode.forEach(suggestion -> {
                String area = suggestion.path("workout").asText();
                String detail = suggestion.path("description").asText();
                suggestions.add(String.format("%s: %s", area, detail));
            });
        }
        return suggestions.isEmpty() ?
                Collections.singletonList("No Specific Suggestions Provided") :
                suggestions;
    }

    private List<String> extractImprovements(JsonNode improvementsNode) {
        List<String> improvements = new ArrayList<>();
        if(improvementsNode.isArray()){
            improvementsNode.forEach(improvement -> {
                String area = improvement.path("area").asText();
                String detail = improvement.path("recommendation").asText();
                improvements.add(String.format("%s: %s", area, detail));
            });
        }
        return improvements.isEmpty() ?
                Collections.singletonList("No Specific Improvement Provided") :
                improvements;
    }

    private void addAnalysisSection(StringBuilder fullAnalysis, JsonNode analysisNode, String key, String prefix) {
         if(!analysisNode.path(key).isMissingNode()){
             fullAnalysis.append(prefix)
                     .append(analysisNode.path(key).asText())
                     .append("\n\n");
         }
    }

    private String createPromptForActivity(Activity activity) {
        return String.format("""
                Analyze this fitness activity and provide provide me detailed recommendations in the following EXACT JSON format:
                {
                  "analysis": {
                    "overall": "Overall analysis here",
                    "pace": "Pace analysis here",
                    "heartRate": "Heart rate analysis here",
                    "caloriesBurned": "Calories analysis here"
                  },
                  "improvements": [
                    {
                      "area": "Area name",
                      "recommendation": "Detailed recommendation"
                    }
                  ],
                  "suggestions": [
                    {
                      "workout": "Workout name",
                      "description": "Detailed workout description"
                    }
                  ],
                  "safety": [
                    "Safety tip 1",
                    "Safety tip 2"
                  ]
                }

                Analyze this activity:
                Activity Type: %s
                Duration: %s minutes
                Calories Burned: %s
                Additional Metrics: %s

                Provide detailed analysis focusing on performance, areas of improvement, next workout suggestions, and safety guidelines.
                Ensure the response follows the EXACT JSON format shown above.
                """,
                activity.getType(),
                activity.getDuration(),
                activity.getCalories(),
                activity.getAdditionalmetrics()
        );
    }
}
