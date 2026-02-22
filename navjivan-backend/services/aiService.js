import axios from "axios";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const SYSTEM_PROMPT = `You are now my personal fitness trainer and mental wellness coach.
Your job is to create personalized workout and nutrition guidance, while also providing mental health support, stress management, and motivation based on my goals, fitness level, lifestyle, and mental state.

Your responsibilities:

PHYSICAL FITNESS:
- Design structured weekly workout plans with sets, reps, and rest timing
- Provide variations for home workouts and gym workouts
- Offer guidance on proper form, warm-up and cooldown routines, and injury-safe training
- Suggest nutrition tips aligned with goals (fat loss, muscle gain, or general fitness)
- Track progress and adjust plans based on feedback

MENTAL WELLNESS:
- Provide emotional support and mental health guidance
- Offer stress management techniques and coping strategies
- Help with motivation, consistency, and overcoming mental barriers
- Address workout anxiety, burnout, and mental fatigue
- Encourage mindfulness, meditation, and mental recovery
- Help build mental resilience and positive self-talk

COMMUNICATION STYLE:
- Keep responses encouraging, practical, and easy to follow
- Be empathetic and understanding about mental health struggles
- Give scientific reasoning only when asked
- Don't use emojis or ** markdown formatting
- Be conversational but professional

Whenever you create a plan, format it clearly like this:
Workout Plan:
Day 1 – Chest & Triceps
• Exercise 1: Bench Press – 4 sets x 8–10 reps (90 sec rest)
• Exercise 2: …

Nutrition Overview:
• Protein target
• Carbs target
• Meal suggestions

For mental health topics:
- Listen actively and validate feelings
- Provide actionable coping strategies
- Encourage professional help when needed
- Focus on building sustainable habits and mindset

First message requirement:
Introduce yourself shortly as a fitness trainer and mental wellness coach. Ask clarifying questions before giving any plan:
- What is your current fitness goal? (Fat loss / Muscle gain / Strength / General fitness)
- Where do you train? (Home / Gym)
- What is your current fitness level? (Beginner / Intermediate / Advanced)
- Any injuries or medical considerations?
- Age, weight, and height?
- Training days available per week?
- How's your mental state and stress level lately?


Answer in short and emotional and with human touch and without emoji and **
`;

/**
 * Call OpenRouter API with messages
 * @param {Array} messages - Array of message objects with role and content
 * @param {boolean} jsonMode - Whether to request JSON response format
 * @returns {Promise<string>} - AI response content
 */
export const callOpenRouter = async (messages, jsonMode = false) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is missing from environment variables!");
    return null;
  }

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: "google/gemini-2.0-flash-001",  
        messages: messages,
        ...(jsonMode && { response_format: { type: "json_object" } }),
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://navjivana.app",
          "X-Title": "Navjivan App",
        },
        timeout: 45000,
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("OpenRouter API Error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Analyze food text and return nutritional information
 * @param {string} foodText - Description of the food
 * @returns {Promise<Object>} - Nutrition data object
 */
export const analyzeFoodWithAI = async (foodText) => {
  if (!foodText) throw new Error("Food text required");

  const prompt = `You are a nutrition expert. Analyze the food: "${foodText}".
    Provide a SCIENTIFICALLY ACCURATE estimation of calories and macros.
    If quantity is not specified, assume a standard serving size.
    
    Return ONLY a raw JSON object (no markdown) with:
    {
      "name": "Concise food name (e.g., 'Grilled Chicken Breast, 200g')",
      "calories": number (kcal),
      "protein": number (grams),
      "carbs": number (grams),
      "fats": number (grams)
    }`;

  const messages = [
    { role: "system", content: "You are a nutrition expert. Always respond with valid JSON only, no markdown formatting." },
    { role: "user", content: prompt }
  ];

  const responseText = await callOpenRouter(messages, true);
  const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson);
};

/**
 * Suggest a smart meal based on eating history and current time
 * @param {Array} history - Array of previously eaten meals
 * @param {number} currentHour - Current hour (0-23)
 * @returns {Promise<Object>} - Meal suggestion object
 */
export const suggestMealWithAI = async (history, currentHour) => {
  const timeOfDay = currentHour < 11 ? "Morning/Breakfast" : currentHour < 15 ? "Lunch" : currentHour < 19 ? "Dinner" : "Late Night Snack";
  
  const cuisines = ["North Indian", "South Indian", "Maharashtrian", "Gujarati", "Healthy Fusion", "Punjabi", "Rajasthani"];
  const randomCuisine = cuisines[Math.floor(Math.random() * cuisines.length)];

  const prompt = `You are a creative Indian nutrition assistant. Based on what the user has eaten today, suggest their NEXT meal.

Current Time: ${timeOfDay} (${currentHour}:00)
Meals eaten today: ${history.length > 0 ? JSON.stringify(history) : "Nothing yet (first meal of the day)"}

Analyze their intake and suggest ONE delicious, healthy INDIAN meal that:
1. Is from **${randomCuisine}** cuisine (for variety).
2. Is appropriate for ${timeOfDay}.
3. Complements their nutrition (if they had heavy carbs, suggest light protein).
4. Suggest diverse regional specials (e.g., Dhokla, Thalipeeth, Appam, Paratha, Cheela). Avoid common repetitive meals.

${history.length === 0 ? "Since this is their first meal, suggest a nutritious breakfast option." : ""}
${history.length > 0 ? `They've had approximately ${history.length} meal(s). Suggest something that fills nutritional gaps.` : ""}

Return ONLY a raw JSON object (no markdown):
{
  "mealName": "Name of the meal",
  "reason": "1 short sentence on why this ${randomCuisine} Dish is great now.",
  "calories": estimated kcal as number,
  "protein": estimated protein in grams as number
}`;

  const messages = [
    { role: "system", content: "You are an expert Indian nutritionist. Respond ONLY with valid JSON. No markdown, no explanation, just the JSON object." },
    { role: "user", content: prompt }
  ];

  const responseText = await callOpenRouter(messages, true);
  
  if (!responseText) return null;
  
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  const splitJson = jsonMatch ? jsonMatch[0] : responseText;
  const cleanJson = splitJson.replace(/```json/g, '').replace(/```/g, '').trim();
  
  return JSON.parse(cleanJson);
};

/**
 * Analyze questionnaire data and recommend fitness level and smoking plan
 * @param {Object} healthData - User's health information
 * @param {Object} smokingData - User's smoking information
 * @returns {Promise<Object>} - Analysis results
 */
export const analyzeQuestionnaireWithAI = async (healthData, smokingData) => {
  let prompt = "";
  
  if (healthData) {
    prompt += `Analyze this user's health profile and recommend a fitness level.
      
Health Data:
- Height: ${healthData.height}
- Weight: ${healthData.weight}
- Weekly workout hours: ${healthData.workoutHours}
- Diabetic: ${healthData.diabetic}
- Heart condition: ${healthData.heartCondition}
- Daily sleep: ${healthData.sleepHours}
- Blood pressure: ${healthData.bloodPressure}
- Location: ${healthData.state}, India

Rules for fitness level:
- "beginner": Low workout hours, health conditions, or older/overweight
- "intermediate": Moderate workout, no major health issues
- "advanced": High workout hours, excellent health profile
`;
  }

  if (smokingData) {
    prompt += `
Analyze this user's smoking habits and recommend a quitting plan.

Smoking Data:
- Cigarettes per day: ${smokingData.cigarettesPerDay}
- First cigarette timing: ${smokingData.firstCigarette}
- Craving strength: ${smokingData.cravingStrength}
- Irritation without smoking: ${smokingData.irritation}
- Main trigger: ${smokingData.trigger}
- Stress smoking: ${smokingData.stressSmoking}
- Previous quit attempts: ${smokingData.quitAttempts}
- Motivation level: ${smokingData.motivation}
- Preferred approach: ${smokingData.preferredApproach}
- Withdrawal symptoms: ${smokingData.withdrawalSymptoms}

Rules for smoking plan:
- "cold-turkey": High motivation (7+), prefers immediate, low cigarettes, mild withdrawal.
- "gradual": Heavy smoker, severe withdrawal, tried before, moderate motivation.
`;
  }

  prompt += `
Return ONLY valid JSON:
{
  ${healthData ? '"fitnessLevel": "beginner" | "intermediate" | "advanced",' : ''}
  ${smokingData ? '"smokingPlan": "cold-turkey" | "gradual",' : ''}
  "reasoning": "Brief 1-2 sentence explanation of the recommendation"
}`;

  const messages = [
    { role: "system", content: "You are a health assessment AI. Analyze user data and recommend appropriate plans. Always respond with valid JSON only." },
    { role: "user", content: prompt }
  ];

  const responseText = await callOpenRouter(messages, true);
  const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson);
};

/**
 * Generate personalized daily goals based on user profile
 * @param {Object} healthData - User's health information
 * @param {Object} smokingData - User's smoking information
 * @param {string} fitnessLevel - User's fitness level
 * @param {string} smokingPlan - User's smoking plan
 * @returns {Promise<Array>} - Array of goal objects
 */
export const generateGoalsWithAI = async (healthData, smokingData, fitnessLevel, smokingPlan) => {
  let userProfile = "";
  if (healthData) {
    userProfile += `- Fitness Level: ${fitnessLevel}
- Height: ${healthData.height}
- Weight: ${healthData.weight}
- Weekly workout: ${healthData.workoutHours}
- Diabetic: ${healthData.diabetic}
- Condition: ${healthData.heartCondition}
`;
  }
  
  if (smokingData) {
    userProfile += `- Smoker: Yes
- Plan: ${smokingPlan}
- Cigarettes/day: ${smokingData.cigarettesPerDay}
- Main trigger: ${smokingData.trigger}
`;
  } else {
    userProfile += `- Smoker: No`;
  }

  const prompt = `Generate 5 personalized daily goals based on this profile.

User Profile:
${userProfile}

Create 5 SPECIFIC, ACHIEVABLE daily goals that:
${smokingData ? `1. Focus on QUITTING SMOKING via ${smokingPlan} method.
2. Manage withdrawal symptoms and triggers.` : `1. Focus on improving general fitness and wellness.
2. Match their fitness level (${fitnessLevel}).`}

Icons available: "ban-outline", "water-outline", "walk-outline", "fitness-outline", "time-outline", "trending-down", "heart-outline", "bed-outline", "restaurant-outline", "leaf-outline", "medkit-outline", "bicycle-outline", "barbell-outline", "footsteps-outline", "timer-outline"

Return ONLY valid JSON array:
[
  { "text": "Goal description (max 30 chars)", "icon": "icon-name" },
  ...5 goals
]`;

  const messages = [
    { role: "system", content: "You are a health goals generator. Create specific, achievable daily goals. Always respond with valid JSON array only." },
    { role: "user", content: prompt }
  ];

  const responseText = await callOpenRouter(messages, true);
  const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson);
};

/**
 * Generate agentic personalized goals based on user activity and profile
 * NOW WITH VECTOR DB CONTEXT!
 * @param {Object} params - Parameters for goal generation
 * @returns {Promise<Array>} - Array of goal objects
 */
export const generateAgenticGoalsWithAI = async ({ userId, healthData, completedGoals, fitnessLevel, currentStreak, bmi, vectorContext }) => {
  // Build base prompt
  let prompt = `You are a smart fitness coach AI. Generate EXACTLY 6 personalized daily wellness goals for a user.

USER PROFILE:
- Fitness Level: ${fitnessLevel || 'beginner'}
- Current Streak: ${currentStreak || 0} days
- BMI: ${bmi || 'Not provided'}
${healthData ? `
- Height: ${healthData.height || 'N/A'}
- Weight: ${healthData.weight || 'N/A'}
- Workout Hours/Week: ${healthData.workoutHours || 'N/A'}
- Sleep Hours: ${healthData.sleepHours || 'N/A'}
- Diabetic: ${healthData.diabetic || 'No'}
- Heart Condition: ${healthData.heartCondition || 'No'}
- Blood Pressure: ${healthData.bloodPressure || 'Normal'}
` : ''}

RECENTLY COMPLETED GOALS (avoid repetition):
${completedGoals && completedGoals.length > 0 ? completedGoals.join(', ') : 'None yet'}
`;

  // ADD VECTOR CONTEXT IF AVAILABLE
  if (vectorContext && vectorContext.available) {
    prompt += `\n\nHISTORICAL CONTEXT FROM VECTOR DB:`;
    
    // Add successful goals patterns
    if (vectorContext.successfulGoals && vectorContext.successfulGoals.length > 0) {
      prompt += `\n\nSUCCESSFUL GOALS (user completed these before):`;
      vectorContext.successfulGoals.slice(0, 5).forEach((goal, idx) => {
        prompt += `\n${idx + 1}. "${goal.goal}" - Difficulty: ${goal.difficulty}, Enjoyment: ${goal.enjoyment}/5, Similarity: ${(goal.similarity * 100).toFixed(0)}%`;
      });
    }

    // Add failed goals to avoid
    if (vectorContext.failedGoals && vectorContext.failedGoals.length > 0) {
      prompt += `\n\nFAILED GOALS (avoid similar ones):`;
      vectorContext.failedGoals.slice(0, 3).forEach((goal, idx) => {
        prompt += `\n${idx + 1}. "${goal.goal}" - User struggled with this`;
      });
    }

    // Add patterns
    if (vectorContext.patterns) {
      const p = vectorContext.patterns;
      prompt += `\n\nLEARNED PATTERNS:`;
      if (p.successRate > 0) {
        prompt += `\n- Overall success rate: ${(p.successRate * 100).toFixed(0)}%`;
      }
      if (p.preferredCategories && p.preferredCategories.length > 0) {
        prompt += `\n- Preferred activities: ${p.preferredCategories.join(', ')}`;
      }
      if (p.bestTimeOfDay) {
        prompt += `\n- Best time of day: ${p.bestTimeOfDay}`;
      }
      if (p.bestDayOfWeek) {
        prompt += `\n- Most successful on: ${p.bestDayOfWeek}`;
      }
      if (p.commonDifficulties && p.commonDifficulties.length > 0) {
        prompt += `\n- Comfortable difficulty levels: ${p.commonDifficulties.slice(0, 2).join(', ')}`;
      }
      if (p.avoidCategories && p.avoidCategories.length > 0) {
        prompt += `\n- Struggles with: ${p.avoidCategories.join(', ')} (suggest carefully or avoid)`;
      }
    }

    prompt += `\n\nIMPORTANT: Use this historical context to:
- Suggest goals similar to successful ones
- Avoid patterns that failed before
- Match user's preferred difficulty level
- Suggest optimal timing if data available
- Build on proven progressions`;
  }

  prompt += `\n\nINSTRUCTIONS:
1. Generate 6 diverse, achievable goals appropriate for the user's fitness level
2. Include a mix of: hydration, nutrition, exercise, sleep, and mindfulness
3. For beginners: keep goals easy and encouraging
4. For intermediate: moderate challenge
5. For advanced: challenging but realistic
6. If user has health conditions (diabetes, heart, BP), adjust goals to be safe
7. Avoid repeating recently completed goals - suggest new variations
8. Consider current streak - longer streak = slightly harder goals
${vectorContext && vectorContext.available ? '9. USE THE HISTORICAL CONTEXT ABOVE to suggest proven goals for this user' : ''}

ICON OPTIONS (use exactly one per goal):
water-outline, walk-outline, bed-outline, restaurant-outline, fitness-outline, 
barbell-outline, footsteps-outline, heart-outline, leaf-outline, sunny-outline,
bicycle-outline, body-outline, pulse-outline, trending-up-outline, trophy-outline

Return ONLY a JSON array of 6 goals:
[
  { "text": "Goal description (max 35 characters)", "icon": "icon-name" },
  ...
]`;

  const messages = [
    { role: "system", content: "You are a fitness coach with access to user's historical goal data. Use this context to generate personalized, proven goals. Return ONLY valid JSON array. No markdown, no explanation." },
    { role: "user", content: prompt }
  ];

  const responseText = await callOpenRouter(messages, true);
  
  if (!responseText) return null;
  
  const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  const goals = JSON.parse(cleanJson);

  if (!Array.isArray(goals) || goals.length !== 6) {
    throw new Error("Invalid goals format from AI");
  }

  return goals;
};

/**
 * Chat with the AI coach
 * @param {string} message - User's message
 * @param {Array} chatHistory - Previous chat messages (optional)
 * @returns {Promise<string>} - AI response
 */
export const chatWithAICoach = async (message, chatHistory = []) => {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: message }
  ];

  return await callOpenRouter(messages);
};

/**
 * Calculate health risks using AI based on user data
 * @param {Object} user - User profile data
 * @returns {Promise<Object>} - Risk assessment
 */
export const calculateHealthRiskWithAI = async (user) => {
  const prompt = `You are a medical risk assessment AI. Calculate the estimated 10-year probability (percentage 0-100) of Lung Cancer Risk and Cardiovascular/Stroke Risk for this individual based on their complete health and smoking profile.

SMOKING PROFILE:
- Smoker Status: ${user.isSmoker ? 'Yes' : 'No'}
- Cigarettes Per Day: ${user.smokingData?.cigarettesPerDay || 'Unknown'}
- First Cigarette After Waking: ${user.smokingData?.firstCigarette || 'Unknown'}
- Craving Strength: ${user.smokingData?.cravingStrength || 'Unknown'}
- Irritation Without Smoking: ${user.smokingData?.irritation || 'Unknown'}
- Main Trigger: ${user.smokingData?.trigger || 'Unknown'}
- Stress Smoking Pattern: ${user.smokingData?.stressSmoking || 'Unknown'}
- Previous Quit Attempts: ${user.smokingData?.quitAttempts || 'Unknown'}
- Motivation Level: ${user.smokingData?.motivation || 'Unknown'}
- Preferred Quit Approach: ${user.smokingData?.preferredApproach || 'Unknown'}
- Withdrawal Symptoms: ${user.smokingData?.withdrawalSymptoms || 'Unknown'}

HEALTH PROFILE:
- Age: ${user.age || 'Unknown (assume 35)'}
- Height: ${user.healthData?.height || 'Unknown'}
- Weight: ${user.healthData?.weight || 'Unknown'}
- Weekly Workout Hours: ${user.healthData?.workoutHours || 'Unknown'}
- Diabetic Status: ${user.healthData?.diabetic || 'No'}
- Heart Condition: ${user.healthData?.heartCondition || 'None'}
- Daily Sleep Hours: ${user.healthData?.sleepHours || 'Unknown'}
- Blood Pressure: ${user.healthData?.bloodPressure || 'Unknown'}
- Location: ${user.healthData?.state || 'Unknown'}, India

RISK CALCULATION GUIDELINES:
- Use standard epidemiological models (Framingham, QRISK3, etc.)
- Consider cumulative smoking exposure and dependency level
- Factor in comorbidities (diabetes, hypertension, heart conditions)
- Account for lifestyle factors (exercise, sleep, stress)
- Higher dependency (early morning smoking, strong cravings) = Higher risk
- Adjust for age, gender (if available), and BMI

Return ONLY valid JSON (no markdown, no explanation):
{
  "lungRisk": <number 0-100>,
  "strokeRisk": <number 0-100>,
  "message": "<One impactful sentence based on their highest risk factor>"
}`;

  const messages = [
    { role: "system", content: "You are a clinical risk assessment AI specializing in smoking-related health risks. Use evidence-based medical data. Return ONLY valid JSON." },
    { role: "user", content: prompt }
  ];

  try {
    const responseText = await callOpenRouter(messages, true);
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    
    // Validate the response
    if (typeof parsed.lungRisk !== 'number' || typeof parsed.strokeRisk !== 'number') {
      throw new Error('Invalid risk values');
    }
    
    return parsed;
  } catch (e) {
    console.error("Risk AI Error:", e);
    // Fallback based on basic smoking data
    const cigsPerDay = parseInt(user.smokingData?.cigarettesPerDay?.split('-')?.[0] || '10');
    const hasHeartCondition = user.healthData?.heartCondition && user.healthData.heartCondition !== 'No';
    const hasHypertension = user.healthData?.bloodPressure === 'High (Hypertension)';
    
    let lungRisk = cigsPerDay > 15 ? 25 : cigsPerDay > 10 ? 18 : 12;
    let strokeRisk = cigsPerDay > 15 ? 22 : cigsPerDay > 10 ? 16 : 10;
    
    if (hasHeartCondition) strokeRisk += 8;
    if (hasHypertension) strokeRisk += 5;
    
    return { 
      lungRisk: Math.min(lungRisk, 100), 
      strokeRisk: Math.min(strokeRisk, 100), 
      message: "Based on your smoking habits, quitting now significantly reduces your health risks." 
    };
  }
};
