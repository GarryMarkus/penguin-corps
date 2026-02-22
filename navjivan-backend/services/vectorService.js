import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Pinecone client
let pinecone = null;
let pineconeIndex = null;

// Initialize Gemini for embeddings
let genAI = null;

const PINECONE_INDEX_NAME = 'navjivan-goals';
const EMBEDDING_MODEL = 'text-embedding-004'; // Gemini embedding model (768 dimensions)
const VECTOR_DIMENSION = 768; // Gemini uses 768 dimensions

/**
 * Initialize Pinecone connection
 */
export const initializePinecone = async () => {
  try {
    if (!process.env.PINECONE_API_KEY) {
      console.warn('[VectorDB] PINECONE_API_KEY not found. Vector features disabled.');
      return false;
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('[VectorDB] GEMINI_API_KEY not found. Using fallback without embeddings.');
      return false;
    }

    // Initialize Pinecone
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // Initialize Gemini
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Get or create index
    try {
      pineconeIndex = pinecone.index(PINECONE_INDEX_NAME);
      console.log(`[VectorDB] Connected to Pinecone index: ${PINECONE_INDEX_NAME}`);
      console.log(`[VectorDB] Using Gemini ${EMBEDDING_MODEL} for embeddings (${VECTOR_DIMENSION}D)`);
      return true;
    } catch (error) {
      console.error('[VectorDB] Failed to connect to index:', error.message);
      console.log('[VectorDB] Please create the index manually in Pinecone dashboard');
      console.log(`[VectorDB] Index name: ${PINECONE_INDEX_NAME}, Dimension: ${VECTOR_DIMENSION}`);
      return false;
    }
  } catch (error) {
    console.error('[VectorDB] Initialization error:', error);
    return false;
  }
};

/**
 * Check if Vector DB is available
 */
export const isVectorDBAvailable = () => {
  return pinecone !== null && genAI !== null && pineconeIndex !== null;
};

/**
 * Generate embedding for text using Gemini
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector
 */
export const generateEmbedding = async (text) => {
  try {
    if (!genAI) throw new Error('Gemini not initialized');

    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    
    return result.embedding.values;
  } catch (error) {
    console.error('[VectorDB] Embedding generation error:', error);
    throw error;
  }
};

/**
 * Store a goal in Vector DB
 * @param {Object} goalData - Goal data to store
 * @returns {Promise<string>} - Vector ID
 */
export const storeGoal = async (goalData) => {
  try {
    if (!isVectorDBAvailable()) {
      console.warn('[VectorDB] Vector DB not available, skipping storage');
      return null;
    }

    const {
      userId,
      goalText,
      category,
      completed,
      completionDate,
      difficulty,
      enjoyment,
      fitnessLevel,
      currentStreak,
      bmi,
      dayOfWeek,
      timeOfDay,
      energyLevel,
      mood,
      willingToRepeat,
      createdAt,
    } = goalData;

    // Generate rich text for embedding (captures semantic meaning)
    const embeddingText = `
      Goal: ${goalText}
      Category: ${category || 'general'}
      Completed: ${completed ? 'yes' : 'no'}
      Difficulty: ${difficulty || 'unknown'}
      Enjoyment: ${enjoyment || 'neutral'}
      Context: ${dayOfWeek || ''} ${timeOfDay || ''} ${energyLevel || ''} ${mood || ''}
      User: fitness level ${fitnessLevel || 'unknown'}, streak ${currentStreak || 0} days
    `.trim();

    // Generate embedding
    const embedding = await generateEmbedding(embeddingText);

    // Create unique ID
    const vectorId = `goal_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare metadata (Pinecone limits: values must be strings, numbers, booleans, or arrays)
    const metadata = {
      userId: String(userId),
      goalText: String(goalText),
      category: String(category || 'general'),
      completed: Boolean(completed),
      completionDate: completionDate ? String(completionDate) : '',
      difficulty: String(difficulty || 'unknown'),
      enjoyment: Number(enjoyment || 0),
      fitnessLevel: String(fitnessLevel || 'unknown'),
      currentStreak: Number(currentStreak || 0),
      bmi: Number(bmi || 0),
      dayOfWeek: String(dayOfWeek || ''),
      timeOfDay: String(timeOfDay || ''),
      energyLevel: String(energyLevel || ''),
      mood: String(mood || ''),
      willingToRepeat: Boolean(willingToRepeat !== false),
      createdAt: String(createdAt || new Date().toISOString()),
      timestamp: Date.now(),
    };

    // Upsert to Pinecone
    await pineconeIndex.namespace(userId).upsert([
      {
        id: vectorId,
        values: embedding,
        metadata: metadata,
      },
    ]);

    console.log(`[VectorDB] Stored goal: ${vectorId} for user ${userId}`);
    return vectorId;
  } catch (error) {
    console.error('[VectorDB] Error storing goal:', error);
    return null;
  }
};

/**
 * Search for similar goals
 * @param {string} userId - User ID
 * @param {string} query - Search query
 * @param {Object} filters - Optional filters
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} - Similar goals
 */
export const searchSimilarGoals = async (userId, query, filters = {}, limit = 10) => {
  try {
    if (!isVectorDBAvailable()) {
      console.warn('[VectorDB] Vector DB not available');
      return [];
    }

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Build filter
    const filter = {};
    if (filters.completed !== undefined) {
      filter.completed = { $eq: filters.completed };
    }
    if (filters.category) {
      filter.category = { $eq: filters.category };
    }
    if (filters.minEnjoyment !== undefined) {
      filter.enjoyment = { $gte: filters.minEnjoyment };
    }

    // Search in user's namespace
    const searchResults = await pineconeIndex.namespace(userId).query({
      vector: queryEmbedding,
      topK: limit,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    // Format results
    const results = searchResults.matches.map(match => ({
      id: match.id,
      similarity: match.score,
      goal: match.metadata.goalText,
      completed: match.metadata.completed,
      difficulty: match.metadata.difficulty,
      enjoyment: match.metadata.enjoyment,
      category: match.metadata.category,
      dayOfWeek: match.metadata.dayOfWeek,
      timeOfDay: match.metadata.timeOfDay,
      createdAt: match.metadata.createdAt,
      metadata: match.metadata,
    }));

    console.log(`[VectorDB] Found ${results.length} similar goals for user ${userId}`);
    return results;
  } catch (error) {
    console.error('[VectorDB] Search error:', error);
    return [];
  }
};

/**
 * Get relevant context for goal generation
 * @param {string} userId - User ID
 * @param {Object} params - Context parameters
 * @returns {Promise<Object>} - Relevant context
 */
export const getRelevantContext = async (userId, params = {}) => {
  try {
    if (!isVectorDBAvailable()) {
      return { available: false, message: 'Vector DB not available' };
    }

    const { fitnessLevel, currentStreak, category = 'general' } = params;

    // Search for successful goals
    const successfulGoals = await searchSimilarGoals(
      userId,
      `${category} goal for ${fitnessLevel} fitness level`,
      { completed: true, minEnjoyment: 3 },
      10
    );

    // Search for failed goals (to avoid)
    const failedGoals = await searchSimilarGoals(
      userId,
      `${category} goal`,
      { completed: false },
      5
    );

    // Analyze patterns
    const patterns = analyzeGoalPatterns(successfulGoals, failedGoals);

    return {
      available: true,
      successfulGoals: successfulGoals.slice(0, 5),
      failedGoals: failedGoals.slice(0, 3),
      patterns,
      totalGoalsTracked: successfulGoals.length + failedGoals.length,
    };
  } catch (error) {
    console.error('[VectorDB] Context retrieval error:', error);
    return { available: false, error: error.message };
  }
};

/**
 * Analyze patterns from goal history
 * @param {Array} successfulGoals - Successful goals
 * @param {Array} failedGoals - Failed goals
 * @returns {Object} - Patterns
 */
const analyzeGoalPatterns = (successfulGoals, failedGoals) => {
  const patterns = {
    successRate: 0,
    preferredCategories: [],
    bestTimeOfDay: null,
    bestDayOfWeek: null,
    averageEnjoyment: 0,
    commonDifficulties: [],
    avoidCategories: [],
  };

  if (successfulGoals.length === 0) return patterns;

  // Success rate
  const total = successfulGoals.length + failedGoals.length;
  patterns.successRate = total > 0 ? (successfulGoals.length / total) : 0;

  // Category analysis
  const categoryCount = {};
  successfulGoals.forEach(goal => {
    const cat = goal.category || 'general';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  patterns.preferredCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat)
    .slice(0, 3);

  // Time of day analysis
  const timeCount = {};
  successfulGoals.forEach(goal => {
    const time = goal.timeOfDay;
    if (time) timeCount[time] = (timeCount[time] || 0) + 1;
  });
  if (Object.keys(timeCount).length > 0) {
    patterns.bestTimeOfDay = Object.entries(timeCount)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  // Day of week analysis
  const dayCount = {};
  successfulGoals.forEach(goal => {
    const day = goal.dayOfWeek;
    if (day) dayCount[day] = (dayCount[day] || 0) + 1;
  });
  if (Object.keys(dayCount).length > 0) {
    patterns.bestDayOfWeek = Object.entries(dayCount)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  // Average enjoyment
  const enjoymentSum = successfulGoals.reduce((sum, goal) => sum + (goal.enjoyment || 0), 0);
  patterns.averageEnjoyment = successfulGoals.length > 0 
    ? enjoymentSum / successfulGoals.length 
    : 0;

  // Common difficulties
  const difficultyCount = {};
  successfulGoals.forEach(goal => {
    const diff = goal.difficulty;
    if (diff) difficultyCount[diff] = (difficultyCount[diff] || 0) + 1;
  });
  patterns.commonDifficulties = Object.entries(difficultyCount)
    .sort((a, b) => b[1] - a[1])
    .map(([diff]) => diff);

  // Categories to avoid (from failed goals)
  const failedCategoryCount = {};
  failedGoals.forEach(goal => {
    const cat = goal.category || 'general';
    failedCategoryCount[cat] = (failedCategoryCount[cat] || 0) + 1;
  });
  patterns.avoidCategories = Object.entries(failedCategoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat)
    .slice(0, 2);

  return patterns;
};

/**
 * Delete all goals for a user (for testing/cleanup)
 * @param {string} userId - User ID
 */
export const deleteUserGoals = async (userId) => {
  try {
    if (!isVectorDBAvailable()) {
      console.warn('[VectorDB] Vector DB not available');
      return false;
    }

    await pineconeIndex.namespace(userId).deleteAll();
    console.log(`[VectorDB] Deleted all goals for user ${userId}`);
    return true;
  } catch (error) {
    console.error('[VectorDB] Delete error:', error);
    return false;
  }
};

/**
 * Get statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Statistics
 */
export const getUserStats = async (userId) => {
  try {
    if (!isVectorDBAvailable()) {
      return { available: false };
    }

    // Fetch recent goals
    const recentGoals = await searchSimilarGoals(userId, 'recent goals', {}, 50);

    const stats = {
      available: true,
      totalGoals: recentGoals.length,
      completedGoals: recentGoals.filter(g => g.completed).length,
      averageEnjoyment: 0,
      successRate: 0,
    };

    if (recentGoals.length > 0) {
      const enjoymentSum = recentGoals.reduce((sum, g) => sum + (g.enjoyment || 0), 0);
      stats.averageEnjoyment = enjoymentSum / recentGoals.length;
      stats.successRate = stats.completedGoals / stats.totalGoals;
    }

    return stats;
  } catch (error) {
    console.error('[VectorDB] Stats error:', error);
    return { available: false, error: error.message };
  }
};
