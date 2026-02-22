import { deleteUserGoals, getUserStats, storeGoal } from "../services/vectorService.js";

/**
 * Track a completed or attempted goal
 * POST /api/goals/track
 */
export const trackGoal = async (req, res) => {
  try {
    const {
      goalText,
      category,
      completed,
      difficulty,
      enjoyment,
      energyLevel,
      mood,
      willingToRepeat,
    } = req.body;

    const userId = req.user?.id || 'anonymous';

    if (!goalText) {
      return res.status(400).json({ message: "Goal text is required" });
    }

    // Get current context
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    // Prepare goal data
    const goalData = {
      userId,
      goalText,
      category: category || 'general',
      completed: Boolean(completed),
      completionDate: completed ? now.toISOString() : null,
      difficulty: difficulty || 'unknown',
      enjoyment: enjoyment || 0,
      fitnessLevel: req.body.fitnessLevel || 'unknown',
      currentStreak: req.body.currentStreak || 0,
      bmi: req.body.bmi || 0,
      dayOfWeek,
      timeOfDay,
      energyLevel: energyLevel || 'normal',
      mood: mood || 'neutral',
      willingToRepeat: willingToRepeat !== false,
      createdAt: now.toISOString(),
    };

    console.log('[GoalTracking] Tracking goal for user:', userId, goalData.goalText);

    // Store in Vector DB
    const vectorId = await storeGoal(goalData);

    if (vectorId) {
      console.log('[GoalTracking] Goal stored in Vector DB:', vectorId);
      return res.status(200).json({
        success: true,
        message: "Goal tracked successfully",
        vectorId,
        stored: true,
      });
    } else {
      console.log('[GoalTracking] Vector DB not available, goal not stored');
      return res.status(200).json({
        success: true,
        message: "Goal tracked (Vector DB not available)",
        stored: false,
      });
    }
  } catch (error) {
    console.error('[GoalTracking] Error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to track goal",
      error: error.message,
    });
  }
};

/**
 * Get user's goal statistics
 * GET /api/goals/stats
 */
export const getGoalStats = async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';

    console.log('[GoalTracking] Fetching stats for user:', userId);

    const stats = await getUserStats(userId);

    if (!stats.available) {
      return res.status(200).json({
        available: false,
        message: "Vector DB not available or no goals tracked yet",
      });
    }

    return res.status(200).json({
      available: true,
      stats,
    });
  } catch (error) {
    console.error('[GoalTracking] Stats error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stats",
      error: error.message,
    });
  }
};

/**
 * Delete all goals for a user (for testing/privacy)
 * DELETE /api/goals/clear
 */
export const clearUserGoals = async (req, res) => {
  try {
    const userId = req.user?.id || 'anonymous';

    console.log('[GoalTracking] Clearing all goals for user:', userId);

    const deleted = await deleteUserGoals(userId);

    if (deleted) {
      return res.status(200).json({
        success: true,
        message: "All goals cleared successfully",
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "Vector DB not available or no goals to clear",
      });
    }
  } catch (error) {
    console.error('[GoalTracking] Clear error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to clear goals",
      error: error.message,
    });
  }
};

/**
 * Batch track multiple goals
 * POST /api/goals/track-batch
 */
export const trackBatchGoals = async (req, res) => {
  try {
    const { goals } = req.body;

    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return res.status(400).json({ message: "Goals array is required" });
    }

    const userId = req.user?.id || 'anonymous';
    const results = [];

    console.log('[GoalTracking] Batch tracking', goals.length, 'goals for user:', userId);

    // Get current context once
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

    for (const goal of goals) {
      if (!goal.goalText) {
        results.push({ success: false, error: 'Missing goalText' });
        continue;
      }

      const goalData = {
        userId,
        goalText: goal.goalText,
        category: goal.category || 'general',
        completed: Boolean(goal.completed),
        completionDate: goal.completed ? now.toISOString() : null,
        difficulty: goal.difficulty || 'unknown',
        enjoyment: goal.enjoyment || 0,
        fitnessLevel: goal.fitnessLevel || 'unknown',
        currentStreak: goal.currentStreak || 0,
        bmi: goal.bmi || 0,
        dayOfWeek,
        timeOfDay,
        energyLevel: goal.energyLevel || 'normal',
        mood: goal.mood || 'neutral',
        willingToRepeat: goal.willingToRepeat !== false,
        createdAt: now.toISOString(),
      };

      try {
        const vectorId = await storeGoal(goalData);
        results.push({ success: true, vectorId, goalText: goal.goalText });
      } catch (error) {
        results.push({ success: false, error: error.message, goalText: goal.goalText });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return res.status(200).json({
      success: true,
      message: `Tracked ${successCount}/${goals.length} goals`,
      results,
    });
  } catch (error) {
    console.error('[GoalTracking] Batch track error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to batch track goals",
      error: error.message,
    });
  }
};
