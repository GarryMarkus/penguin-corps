# Navjivan

A mobile app that helps smokers quit while building healthier habits. Think of it as your pocket health coach that actually understands what you're going through.

## What's This About?

Navjivan isn't just another "quit smoking" app with a counter. It combines AI-powered coaching, fitness tracking, and personalized goal generation to help people transition from smoking to a healthier lifestyle. The app learns from your behavior and adapts its recommendations—so the goals you get today are based on what actually worked for you yesterday.

## Core Features

### Smart Goal Generation

- Daily personalized goals based on your fitness level and smoking habits
- AI learns from your completed goals and adjusts future recommendations
- Vector database stores your progress patterns to avoid suggesting things you've failed at before

### Health Risk Assessment

Real-time calculation of lung cancer and stroke risk based on:

- Cigarettes per day
- Smoking triggers
- Health conditions
- Blood pressure and age

Uses Gemini AI to provide percentage-based risk estimates with explanations.

### Smoking Cessation Tools

- Choose between cold turkey or gradual reduction plans
- AI-generated motivational push notifications (every 10 minutes by default, configurable)
- Track cigarettes avoided, money saved, and streak days
- SOS support button for critical moments

### Fitness Integration

- BMI calculator with personalized fitness plans
- Step tracking with real-time calorie burn
- Sport-specific training programs (AI-generated for any sport)
- Daily wellness goals tied to your fitness level

### AI Chat Coach

Talk to an AI fitness and mental wellness coach that:

- Remembers your context
- Provides workout plans
- Offers mental health support and stress management
- Adapts to your communication style

## Tech Stack

**Frontend** (React Native + Expo)

- TypeScript
- Expo Router for navigation
- React Native Reanimated for animations
- Expo Notifications for push alerts
- Context API for state management

**Backend** (Node.js + Express)

- MongoDB for data persistence
- JWT authentication
- Pinecone vector database for agentic AI
- Gemini embeddings (768D vectors)

**AI Services**

- Google Gemini (2.0 Flash) for:
  - Text embeddings
  - Health risk calculations
  - Push notification generation
- OpenRouter API for:
  - Chat conversations
  - Goal generation
  - Questionnaire analysis
  - Meal suggestions
  - Sports training programs

## Project Structure

```
Navjivan/
├── navjivan-frontend/          # React Native app
│   ├── app/
│   │   ├── (tabs)/            # Main app tabs
│   │   ├── onboarding/        # Signup & questionnaire
│   │   ├── fitness/           # Fitness tracking
│   │   └── ai-coach/          # Chat interface
│   ├── components/            # Reusable UI components
│   ├── context/              # Global state
│   └── services/             # API calls
│
└── navjivan-backend/
    └── express-app/
        ├── controllers/       # Route handlers
        ├── models/           # MongoDB schemas
        ├── routes/           # API endpoints
        ├── services/         # AI & vector DB logic
        └── middlewares/      # Auth & validation
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or Expo Go app)

### Environment Variables

**Backend** (`.env` in `navjivan-backend/express-app/`)

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# AI Services
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Vector DB (optional, for agentic AI features)
PINECONE_API_KEY=your_pinecone_api_key
```

**Frontend** (`.env` in `navjivan-frontend/`)

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
```

### Installation

1. **Clone the repo**

   ```bash
   git clone https://github.com/yourusername/Navjivan.git
   cd Navjivan
   ```

2. **Backend setup**

   ```bash
   cd navjivan-backend/express-app
   npm install
   npm run dev
   ```

3. **Frontend setup** (in a new terminal)

   ```bash
   cd navjivan-frontend
   npm install
   npm start
   ```

4. **Run on device**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Or scan QR code with Expo Go app

### Optional: Vector Database Setup

If you want the agentic AI features to work:

1. Create a Pinecone account
2. Create an index named `navjivan-goals` with:
   - Dimensions: 768
   - Metric: cosine
3. Add your API key to backend `.env`

The app works fine without this—it just won't learn from your goal completion patterns.

## API Routes

### Authentication

- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login

### Dashboard

- `GET /api/dashboard/summary` - Get stats, streak, health risks
- `POST /api/dashboard/update-goals` - Update goal progress

### AI Coach

- `POST /api/ai-coach/chat` - Chat with AI
- `POST /api/ai-coach/analyze-food` - Nutrition analysis
- `POST /api/ai-coach/suggest-meal` - Smart meal suggestions
- `POST /api/ai-coach/agentic-goals` - Generate personalized goals
- `POST /api/ai-coach/generate-training` - Sport-specific programs

### Goals

- `GET /api/goals` - Fetch user goals
- `POST /api/goals` - Create goal
- `PATCH /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

## How the Agentic AI Works

This is the interesting part. Most apps just generate random goals. We store every goal you complete in a vector database.

When you ask for new goals:

1. Your request gets embedded into a 768-dimension vector
2. We search for similar goals you've completed successfully
3. We also find goals you failed at (to avoid those patterns)
4. We analyze your success rate, preferred times, difficulty levels
5. All this context gets fed to the AI along with your current state
6. You get 6 goals that are actually tailored to what works _for you_

## Push Notifications

The app sends motivational notifications using Expo's push service. The backend runs a scheduler that:

- Finds all active smokers with push tokens
- Generates unique AI messages for each person
- Sends via Expo Push API
- Frequency: 10 minutes (configurable in `server.js`)

## Design Philosophy

I wanted this to feel like a real app, not a prototype:

- Dark theme with glassmorphism effects
- Smooth animations using Reanimated
- Haptic feedback on interactions
- Gradient backgrounds
- Consistent spacing and typography

The UI adapts to both smokers and non-smokers—if you select "Boost My Fitness" in onboarding, you get fitness-focused screens. Pick "Quit Smoking," and you see risk stats and cessation tools.

## Known Issues

- Vector DB requires manual index creation in Pinecone (not automated)
- Push notifications might not work reliably on iOS simulator (test on real device)
- BMI calculator uses basic formula (doesn't account for muscle mass)
- Some AI responses can be slow if OpenRouter is under load

## Future Ideas

- Social features (find quit buddies)
- Reward system with redeemable points
- Integration with Apple Health / Google Fit
- Voice journaling for cravings
- Community challenges

## Contributing

This is a personal project, but if you want to improve it, feel free to fork and submit PRs. Just keep the code clean and match the existing style.

## License

MIT - do whatever you want with it.

## Credits

Built by Shaurya as a way to combine health tech with practical AI. If this helps even one person quit smoking, it was worth it.

---

**Note**: This app provides health information but isn't a substitute for medical advice. If you're struggling with addiction, please consult healthcare professionals.
