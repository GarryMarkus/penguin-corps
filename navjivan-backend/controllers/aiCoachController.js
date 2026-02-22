import {
    analyzeFoodWithAI,
    analyzeQuestionnaireWithAI,
    callOpenRouter,
    chatWithAICoach,
    generateAgenticGoalsWithAI,
    generateGoalsWithAI,
    generateIndianRecipesFromPantry,
    suggestMealWithAI
} from "../services/aiService.js";

export const chatWithCoach = async (req, res) => {
  try {
    const { message, chatHistory } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      const fallbackResponses = [
        "I'm having a technical moment! While I reconnect, try doing 20 jumping jacks or 10 push-ups to get your blood flowing!",
        "Let me reconnect... In the meantime, remember: consistency beats perfection. Keep moving and stay active!",
        "Technical hiccup on my end! But don't skip your workout - try a quick 5-minute stretch while I sort this out.",
      ];
      return res.status(200).json({
        success: true,
        response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        fallback: true,
      });
    }

    const aiResponse = await chatWithAICoach(message, chatHistory);

    return res.status(200).json({
      success: true,
      response: aiResponse,
    });
  } catch (err) {
    console.error("AI COACH ERROR", err);
    return res.status(500).json({
      success: false,
      message: "AI service interrupted",
      error: err.toString()
    });
  }
};

export const analyzeFood = async (req, res) => {
  const { foodText } = req.body;
  if (!foodText) return res.status(400).json({ message: "Food text required" });

  try {
    if (!process.env.OPENROUTER_API_KEY) throw new Error("API key not configured");

    const nutritionData = await analyzeFoodWithAI(foodText);
    return res.status(200).json(nutritionData);

  } catch (error) {
    console.error("Food Analysis Error:", error);
    
    return res.status(500).json({
      success: false,
      message: "AI Analysis Failed. Check Server Logs.",
      error: error.message || error.toString()
    });
  }
};

// Generate recipes from pantry ingredients
export const generatePantryRecipes = async (req, res) => {
  const { pantryIngredients, mealType } = req.body;
  
  if (!pantryIngredients) {
    return res.status(400).json({ message: "Pantry ingredients required" });
  }

  try {
    if (!process.env.OPENROUTER_API_KEY) {
      // Fallback recipes when API is not available
      return res.status(200).json({
        recipes: [
          {
            name: "Quick Aloo Bhujia",
            cuisine: "Indian",
            ingredients: ["potatoes", "onion", "green chillies", "cumin seeds"],
            steps: ["1. Boil and cube potatoes", "2. Heat oil, add cumin", "3. Add onion and fry", "4. Add potatoes and spices", "5. Cook till crispy"],
            time_minutes: 20,
            video: "https://www.youtube.com/watch?v=example1"
          },
          {
            name: "Simple Dal Tadka",
            cuisine: "Indian",
            ingredients: ["toor dal", "onion", "tomato", "garlic"],
            steps: ["1. Pressure cook dal", "2. Make tadka with garlic and onion", "3. Add tomatoes", "4. Add cooked dal", "5. Simmer 5 mins"],
            time_minutes: 25,
            video: "https://www.youtube.com/watch?v=example2"
          },
          {
            name: "Vegetable Fried Rice",
            cuisine: "Indo-Chinese",
            ingredients: ["rice", "mixed vegetables", "soy sauce", "garlic"],
            steps: ["1. Cook rice and cool", "2. Sauté garlic and veggies", "3. Add rice and soy sauce", "4. Toss on high heat", "5. Serve hot"],
            time_minutes: 15,
            video: "https://www.youtube.com/watch?v=example3"
          }
        ]
      });
    }

    const ingredientText = mealType 
      ? `${pantryIngredients} (for ${mealType})` 
      : pantryIngredients;
    
    const result = await generateIndianRecipesFromPantry(ingredientText);
    return res.status(200).json(result);

  } catch (error) {
    console.error("Pantry Recipe Generation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Recipe generation failed",
      error: error.message || error.toString()
    });
  }
};

export const suggestSmartMeal = async (req, res) => {
  try {
    const { history, currentHour } = req.body;
    
    console.log('[MealSuggestion] Request received:', { history, currentHour });
    
    const timeOfDay = currentHour < 11 ? "Morning/Breakfast" : currentHour < 15 ? "Lunch" : currentHour < 19 ? "Dinner" : "Late Night Snack";
    
    // Randomized Fallback Options (Removed Poha as per user request to avoid repetition)
    const fallbackOptions = {
      "Morning/Breakfast": [
        { mealName: "Masala Omelette with Toast", reason: "High protein start to fuel your day.", calories: 320, protein: 18 },
        { mealName: "Vegetable Upma", reason: "Fibre-rich and easy on digestion.", calories: 250, protein: 7 },
        { mealName: "Besan Chilla", reason: "Protein-packed vegetarian breakfast.", calories: 220, protein: 12 },
        { mealName: "Multigrain Paratha with Curd", reason: "Sustained energy and probiotics.", calories: 300, protein: 9 },
        { mealName: "Idli Sambar", reason: "Light, fermented gut-friendly breakfast.", calories: 240, protein: 8 }
      ],
      "Lunch": [
        { mealName: "Dal Tadka with Jeera Rice", reason: "Complete protein with amino acids.", calories: 450, protein: 18 },
        { mealName: "Rajma Chawal", reason: "Classic comfort food with high fiber.", calories: 480, protein: 16 },
        { mealName: "Paneer Bhurji with Roti", reason: "Excellent source of calcium and protein.", calories: 420, protein: 22 },
        { mealName: "Vegetable Biryani with Raita", reason: "Balanced meal with veggies and probiotics.", calories: 400, protein: 12 },
        { mealName: "Chickpea Curry (Chole) with Roti", reason: "High fibre and protein rich.", calories: 450, protein: 15 }
      ],
      "Dinner": [
        { mealName: "Palak Paneer with Roti", reason: "Iron-rich spinach and protein for recovery.", calories: 380, protein: 22 },
        { mealName: "Grilled Chicken Salad", reason: "Low carb, high protein limit light dinner.", calories: 350, protein: 30 },
        { mealName: "Moong Dal Khichdi", reason: "Light and comforting gut-friendly meal.", calories: 330, protein: 14 },
        { mealName: "Soya Chunk Curry with Roti", reason: "High protein plant-based dinner.", calories: 360, protein: 25 },
        { mealName: "Baingan Bharta with Roti", reason: "Low calorie vegetable dinner.", calories: 280, protein: 8 }
      ],
      "Late Night Snack": [
        { mealName: "Mixed Fruit Chaat", reason: "Hydrating and vitamin-rich light snack.", calories: 120, protein: 2 },
        { mealName: "Masala Buttermilk", reason: "Aids digestion and improves gut health.", calories: 60, protein: 3 },
        { mealName: "Roasted Makhana", reason: "Low calorie crunchy snack.", calories: 100, protein: 3 },
        { mealName: "Warm Turmeric Milk", reason: "Promotes sleep and reduces inflammation.", calories: 140, protein: 8 }
      ]
    };

    const getRandomFallback = (period) => {
        const options = fallbackOptions[period] || fallbackOptions["Lunch"];
        return options[Math.floor(Math.random() * options.length)];
    };
    
    if (!process.env.OPENROUTER_API_KEY) {
        console.log('[MealSuggestion] No API key found, returning fallback');
        return res.json(getRandomFallback(timeOfDay));
    }
    
    console.log('[MealSuggestion] API key found, calling AI for:', timeOfDay);

    try {
      const result = await suggestMealWithAI(history, currentHour);
      
      if (!result) {
        console.log('[MealSuggestion] AI returned null, using fallback');
        return res.json(getRandomFallback(timeOfDay));
      }

      console.log('[MealSuggestion] Sending to client:', result);
      return res.status(200).json(result);
    } catch (parseError) {
      console.error("[MealSuggestion] AI call failed:", parseError.message);
      return res.json(getRandomFallback(timeOfDay));
    }

  } catch (error) {
    console.error("[MealSuggestion] ERROR:", error.message);
    if (error.response?.data) {
      console.error("[MealSuggestion] API Error Details:", JSON.stringify(error.response.data));
    }
    
    // Recalculate timeOfDay inside catch to be safe
    const currentHour = new Date().getHours();
    const timeOfDay = currentHour < 11 ? "Morning/Breakfast" : currentHour < 15 ? "Lunch" : currentHour < 19 ? "Dinner" : "Late Night Snack";
    
    // Quick local definition for fallback access inside catch
     const fallbackOptions = {
      "Morning/Breakfast": [
        { mealName: "Masala Omelette with Toast", reason: "High protein start.", calories: 320, protein: 18 },
        { mealName: "Vegetable Upma", reason: "Fibre-rich and easy.", calories: 250, protein: 7 }
      ],
      "Lunch": [
        { mealName: "Dal Tadka with Jeera Rice", reason: "Complete protein.", calories: 450, protein: 18 },
        { mealName: "Rajma Chawal", reason: "Classic comfort food.", calories: 480, protein: 16 }
      ],
      "Dinner": [
        { mealName: "Palak Paneer with Roti", reason: "Iron-rich spinach.", calories: 380, protein: 22 },
         { mealName: "Moong Dal Khichdi", reason: "Light meal.", calories: 330, protein: 14 }
      ],
      "Late Night Snack": [
        { mealName: "Mixed Fruit Chaat", reason: "Hydrating snack.", calories: 120, protein: 2 },
         { mealName: "Roasted Makhana", reason: "Low calorie.", calories: 100, protein: 3 }
      ]
    };
     const getRandomFallback = (period) => {
        const options = fallbackOptions[period] || fallbackOptions["Lunch"];
        return options[Math.floor(Math.random() * options.length)];
    };


    console.log("[MealSuggestion] Using fallback for:", timeOfDay);
    return res.status(200).json(getRandomFallback(timeOfDay));
  }
};


export const analyzeQuestionnaire = async (req, res) => {
  try {
    const { healthData, smokingData } = req.body;

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(200).json({
        fitnessLevel: "beginner",
        smokingPlan: smokingData ? "gradual" : null,
        goals: getDefaultGoals(smokingData ? "gradual" : null, "beginner")
      });
    }

    const analysis = await analyzeQuestionnaireWithAI(healthData, smokingData);
    
    const fitnessLevel = analysis.fitnessLevel || 'beginner';
    const smokingPlan = analysis.smokingPlan || null;

    const goalsResponse = await generateGoalsInternal(healthData, smokingData, fitnessLevel, smokingPlan);

    return res.status(200).json({
      fitnessLevel: fitnessLevel,
      smokingPlan: smokingPlan,
      reasoning: analysis.reasoning,
      goals: goalsResponse
    });

  } catch (error) {
    console.error("Questionnaire Analysis Error:", error);
    return res.status(200).json({
      fitnessLevel: "beginner",
      smokingPlan: req.body.smokingData ? "gradual" : null,
      goals: getDefaultGoals(req.body.smokingData ? "gradual" : null, "beginner")
    });
  }
};

const generateGoalsInternal = async (healthData, smokingData, fitnessLevel, smokingPlan) => {
  try {
    return await generateGoalsWithAI(healthData, smokingData, fitnessLevel, smokingPlan);
  } catch (error) {
    console.error("Goal Generation Error:", error);
    return getDefaultGoals(smokingPlan, fitnessLevel);
  }
};

const getDefaultGoals = (smokingPlan, fitnessLevel) => {
  if (smokingPlan === 'cold-turkey') {
    return [
      { text: "Zero cigarettes today", icon: "ban-outline" },
      { text: "Drink 8 glasses of water", icon: "water-outline" },
      { text: "10 min mindfulness", icon: "timer-outline" },
      { text: "Identify 3 triggers", icon: "eye-outline" },
      { text: "Walk 15 minutes", icon: "walk-outline" }
    ];
  } else if (smokingPlan === 'gradual') {
    return [
      { text: "Smoke 2 fewer cigarettes", icon: "trending-down" },
      { text: "Delay first smoke by 1hr", icon: "time-outline" },
      { text: "Drink water before smoking", icon: "water-outline" },
      { text: "Track every cigarette", icon: "pencil-outline" },
      { text: "Walk 10 minutes", icon: "walk-outline" }
    ];
  } else {
    const baseGoals = [
      { text: "Drink 8 glasses of water", icon: "water-outline" },
      { text: "Sleep 7+ hours", icon: "bed-outline" },
      { text: "Eat a healthy meal", icon: "restaurant-outline" }
    ];
    
    if (fitnessLevel === 'beginner') {
      baseGoals.push({ text: "Walk 15 minutes", icon: "walk-outline" });
      baseGoals.push({ text: "Stretch for 5 mins", icon: "fitness-outline" });
    } else if (fitnessLevel === 'intermediate') {
      baseGoals.push({ text: "Exercise 30 minutes", icon: "fitness-outline" });
      baseGoals.push({ text: "Take 8000 steps", icon: "footsteps-outline" });
    } else {
      baseGoals.push({ text: "Workout 45 minutes", icon: "barbell-outline" });
      baseGoals.push({ text: "Take 10000 steps", icon: "footsteps-outline" });
    }
    
    return baseGoals;
  }
};

export const generateGoals = async (req, res) => {
  try {
    const { healthData, smokingData, fitnessLevel, smokingPlan } = req.body;
    const goals = await generateGoalsInternal(healthData, smokingData, fitnessLevel, smokingPlan);
    return res.status(200).json({ goals });
  } catch (error) {
    console.error("Generate Goals Error:", error);
    return res.status(500).json({ message: "Failed to generate goals", error: error.message });
  }
};


export const generateAgenticGoals = async (req, res) => {
  try {
    const { 
      healthData,
      completedGoals,
      fitnessLevel,
      currentStreak,
      bmi
    } = req.body;

    console.log('[AgenticAI] Generating personalized goals...', { fitnessLevel, currentStreak, bmi });


    const getFallbackGoals = (level) => {
      const baseGoals = [
        { text: "Drink 8 glasses of water", icon: "water-outline" },
        { text: "Sleep 7+ hours tonight", icon: "bed-outline" },
        { text: "Eat a balanced meal", icon: "restaurant-outline" },
      ];

      if (level === 'beginner') {
        return [
          ...baseGoals,
          { text: "Walk for 15 minutes", icon: "walk-outline" },
          { text: "Do 5 minutes of stretching", icon: "fitness-outline" },
          { text: "Take the stairs instead of elevator", icon: "trending-up-outline" },
        ];
      } else if (level === 'intermediate') {
        return [
          ...baseGoals,
          { text: "Complete a 30-min workout", icon: "barbell-outline" },
          { text: "Walk 5000 steps", icon: "footsteps-outline" },
          { text: "Do 20 push-ups", icon: "fitness-outline" },
        ];
      } else {
        return [
          ...baseGoals,
          { text: "Complete a 45-min intense workout", icon: "barbell-outline" },
          { text: "Walk 10000 steps", icon: "footsteps-outline" },
          { text: "Run 3 kilometers", icon: "walk-outline" },
        ];
      }
    };

    if (!process.env.OPENROUTER_API_KEY) {
      console.log('[AgenticAI] No API key, returning fallback goals');
      return res.json({ goals: getFallbackGoals(fitnessLevel || 'beginner') });
    }

    try {
      console.log('[AgenticAI] Fetching vector context for user:', req.user?.id);
      const vectorContext = await getRelevantContext(req.user?.id || 'anonymous', {
        fitnessLevel,
        currentStreak,
        category: 'general'
      });

      if (vectorContext.available) {
        console.log('[AgenticAI] Vector context retrieved:', {
          successfulGoals: vectorContext.successfulGoals?.length || 0,
          failedGoals: vectorContext.failedGoals?.length || 0,
          patterns: vectorContext.patterns
        });
      } else {
        console.log('[AgenticAI] Vector DB not available, using standard generation');
      }

      const goals = await generateAgenticGoalsWithAI({ 
        userId: req.user?.id || 'anonymous',
        healthData, 
        completedGoals, 
        fitnessLevel, 
        currentStreak, 
        bmi,
        vectorContext  // PASS VECTOR CONTEXT TO AI!
      });
      
      if (!goals) {
        console.log('[AgenticAI] AI returned null, using fallback');
        return res.json({ goals: getFallbackGoals(fitnessLevel || 'beginner') });
      }

      console.log('[AgenticAI] Generated goals:', goals);
      return res.status(200).json({ 
        goals,
        vectorEnhanced: vectorContext?.available || false,
        contexted: vectorContext?.available ? {
          successfulGoalsUsed: vectorContext.successfulGoals?.length || 0,
          patternsLearned: Object.keys(vectorContext.patterns || {}).length
        } : null
      });
    } catch (innerError) {
      console.log('[AgenticAI] AI call failed, using fallback');
      return res.json({ goals: getFallbackGoals(fitnessLevel || 'beginner') });
    }


  } catch (error) {
    console.error("[AgenticAI] Error:", error.message);
    
    // Fallback response inside catch
    const fallbackGoals = [
      { text: "Drink 8 glasses of water", icon: "water-outline" },
      { text: "Walk for 20 minutes", icon: "walk-outline" },
      { text: "Sleep 7+ hours tonight", icon: "bed-outline" },
      { text: "Eat a healthy meal", icon: "restaurant-outline" },
      { text: "Do 10 minutes of stretching", icon: "fitness-outline" },
      { text: "Practice deep breathing", icon: "leaf-outline" },
    ];
    
    return res.status(200).json({ goals: fallbackGoals });
  }
};

/**
 * Generate AI Training Programs for Sports
 * POST /ai-coach/generate-training
 */
export const generateSportsTraining = async (req, res) => {
  try {
    const { sport } = req.body;

    if (!sport) {
      return res.status(400).json({ message: "Sport name is required" });
    }

    console.log('[SportsTraining] Generating programs for:', sport);

    const fallbackPrograms = [
      {
        title: "Beginner Foundation",
        duration: "4 weeks",
        description: `Build fundamental skills and fitness for ${sport}. Perfect for newcomers to develop proper form and basic conditioning.`,
        exercises: [
          "Dynamic warm-up (10 minutes)",
          "Basic technique drills (20 minutes)",
          "Fundamental movements practice",
          "Cardio conditioning (15 minutes)",
          "Cool-down and stretching"
        ],
        icon: "walk"
      },
      {
        title: "Intermediate Development",
        duration: "6 weeks",
        description: `Advance your ${sport} skills with focused training on technique, speed, and tactical understanding.`,
        exercises: [
          "Sport-specific warm-up",
          "Advanced technique work",
          "Speed and agility drills",
          "Tactical scenarios practice",
          "Strength conditioning"
        ],
        icon: "barbell"
      },
      {
        title: "Competition Ready",
        duration: "8 weeks",
        description: `Peak performance program for ${sport}. Intense training designed to prepare you for competitive play.`,
        exercises: [
          "High-intensity interval training",
          "Competition simulation drills",
          "Advanced tactics training",
          "Peak performance conditioning",
          "Mental preparation exercises"
        ],
        icon: "trophy"
      }
    ];

    if (!process.env.OPENROUTER_API_KEY) {
      console.log('[SportsTraining] No API key, returning fallback programs');
      return res.status(200).json({
        success: true,
        programs: fallbackPrograms,
        fallback: true
      });
    }

    try {
      const prompt = `Generate 3 sport-specific training programs for ${sport}. Each program must include UNIQUE exercises specific to ${sport}.

Create 3 different skill levels:
1. Beginner (4 weeks) - Learn basic ${sport} techniques and fundamentals
2. Intermediate (6 weeks) - Develop advanced ${sport} skills and tactics
3. Advanced (8 weeks) - Master ${sport} for competitive performance

For each program provide:
- Title: Creative name reflecting ${sport} and skill level
- Duration: Training period
- Description: 2 sentences about what this ${sport} program achieves
- Exercises: 5 SPECIFIC drills/techniques unique to ${sport} (NOT generic like "warm-up" or "cardio")
- Icon: one of [walk, barbell, trophy, fitness, basketball, football, tennisball, bicycle]

IMPORTANT: 
- Each exercise must be SPECIFIC to ${sport} (e.g., for football: "Passing accuracy drills", "Penalty shootout practice")
- Make exercises DIFFERENT for each skill level
- NO generic exercises like "Dynamic warm-up" or "Cool-down"
- Focus on actual ${sport} skills, tactics, and techniques

Return ONLY this JSON array format:
[
  {
    "title": "${sport}-specific program name",
    "duration": "X weeks",
    "description": "What this ${sport} program achieves",
    "exercises": ["Specific ${sport} drill 1", "Specific ${sport} drill 2", "Specific ${sport} drill 3", "Specific ${sport} drill 4", "Specific ${sport} drill 5"],
    "icon": "icon-name"
  }
]`;

      const messages = [
        { role: "system", content: "You are an expert sports training coach. Provide specific, actionable training programs. Return ONLY valid JSON array." },
        { role: "user", content: prompt }
      ];

      console.log('[SportsTraining] Calling OpenRouter API...');
      const responseText = await callOpenRouter(messages, true);
      console.log('[SportsTraining] OpenRouter response received:', responseText ? responseText.substring(0, 200) : 'null');
      
      if (!responseText) {
        console.log('[SportsTraining] AI returned null, using fallback');
        return res.status(200).json({
          success: true,
          programs: fallbackPrograms,
          fallback: true
        });
      }

      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const programs = JSON.parse(cleanJson);

      if (!Array.isArray(programs) || programs.length === 0) {
        console.log('[SportsTraining] Invalid AI response, using fallback');
        return res.status(200).json({
          success: true,
          programs: fallbackPrograms,
          fallback: true
        });
      }

      console.log('[SportsTraining] Generated', programs.length, 'programs');
      return res.status(200).json({
        success: true,
        programs,
        aiGenerated: true
      });

    } catch (aiError) {
      console.error('[SportsTraining] AI error:', aiError.message);
      return res.status(200).json({
        success: true,
        programs: fallbackPrograms,
        fallback: true
      });
    }

  } catch (error) {
    console.error('[SportsTraining] Error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate training programs",
      error: error.message
    });
  }
};
// Verify water image using AI
export const verifyWaterImage = async (req, res) => {
  const { imageBase64 } = req.body;
  
  if (!imageBase64) {
    return res.status(400).json({ 
      success: false,
      message: "Image data required" 
    });
  }

  try {
    if (!process.env.OPENROUTER_API_KEY) {
      // Fallback - allow logging without AI verification
      return res.status(200).json({
        success: true,
        isWater: true,
        confidence: 50,
        reason: "AI verification unavailable - proceeding with manual confirmation",
        fallback: true
      });
    }

    const { verifyWaterImageWithAI } = await import("../services/aiService.js");
    const result = await verifyWaterImageWithAI(imageBase64);
    
    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error("Water verification error:", error);
    // On error, allow with low confidence
    return res.status(200).json({
      success: true,
      isWater: true,
      confidence: 30,
      reason: "Verification temporarily unavailable - please ensure this is drinking water",
      error: true
    });
  }
};