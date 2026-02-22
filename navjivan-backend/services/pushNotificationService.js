import axios from 'axios';
import User from '../models/User.js';
import { callOpenRouter } from './aiService.js';

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

// Helper to send individual push notification
export const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!pushToken) return;

  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
    };

    await axios.post(EXPO_PUSH_API_URL, message, {
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });
    console.log(`[Push] Sent to ${pushToken.substring(0, 10)}...`);
  } catch (error) {
    console.error('[Push] Error sending notification:', error?.response?.data || error.message);
  }
};

// Generate AI motivational message
const generateMotivationalMessage = async (userName, plan) => {
  try {
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY not configured');
      }

      const prompt = `Write a short, powerful, and unique motivational push notification message for a smoker named ${userName} who is trying to quit.
Their plan is: ${plan}.

Keep the title short (under 30 chars).
Keep the body under 120 chars.

Return ONLY valid JSON: { "title": "...", "body": "..." }`;

      const messages = [
        { role: "system", content: "You are a motivational health coach. Generate encouraging push notifications. Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ];

      const result = await callOpenRouter(messages, true);
      
      if (!result) {
        throw new Error('OpenRouter returned null');
      }
      
      // Clean up markdown code blocks if present
      const cleanText = result.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText);

  } catch (error) {
      console.error('[Push] AI Generation failed, using fallback:', error.message);
      return {
          title: "Keep Going!",
          body: "Every smoke-free hour is a victory. You got this!"
      };
  }
};

// Send notifications to all smokers
export const sendDailyMotivationalNotifications = async () => {
    console.log('[Push] Starting daily motivational push...');
    try {
        const smokers = await User.find({ isSmoker: true, pushToken: { $ne: null } });
        console.log(`[Push] Found ${smokers.length} smokers with tokens.`);

        for (const user of smokers) {
            const message = await generateMotivationalMessage(user.name, user.plan);
            await sendPushNotification(user.pushToken, message.title, message.body);
            // Add small delay to avoid rate limits if many users
            await new Promise(r => setTimeout(r, 100)); 
        }
    } catch (error) {
        console.error('[Push] Batch send error:', error);
    }
};
