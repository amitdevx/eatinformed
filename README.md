#  EatInformed

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-97.7%25-blue?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI%20Powered-4285F4?style=flat&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Firebase](https://img.shields.io/badge/Firebase-Backend-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Genkit](https://img.shields.io/badge/Genkit-1.8.0-orange?style=flat)](https://firebase.google.com/docs/genkit)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

<h3 align="center">
  AI-powered web application to analyze food labels with instant insights into nutritional facts, ingredient breakdown, and potential health risks.
</h3>

<h3 align="center">
  Upload. Analyze. Stay Informed.
</h3>

---

## Overview

**EatInformed** empowers users to make healthier food choices by leveraging advanced AI to decode complex food labels. Simply upload an image of a food product label, and receive comprehensive analysis including nutritional information, ingredient breakdown, allergen warnings, and health risk assessments-all powered by Google Gemini AI with Firebase Genkit integration.

Built with modern web technologies and designed for performance, EatInformed delivers real-time analysis with a beautiful, responsive interface optimized for all devices.

---

## Key Features

### AI-Powered Intelligence
- **Google Gemini AI Integration:** Advanced multimodal AI for accurate image and text analysis
- **Firebase Genkit Framework:** Robust AI workflow orchestration and management
- **Real-Time Processing:** Instant analysis with streaming responses
- **Multi-Language Support:** Analyze labels in various languages

### Comprehensive Analysis
- **Nutritional Facts Extraction:** Complete breakdown of calories, macros, vitamins, and minerals
- **Ingredient Analysis:** Detailed examination of all ingredients with health implications
- **Allergen Detection:** Automatic identification of common allergens (nuts, dairy, gluten, etc.)
- **Health Risk Assessment:** AI-powered evaluation of potentially harmful additives
- **Additive Identification:** Recognition and explanation of E-numbers and preservatives
- **Dietary Compliance:** Check against vegan, vegetarian, keto, and other dietary restrictions

### Modern User Experience
- **Responsive Design:** Seamless experience across desktop, tablet, and mobile devices
- **Beautiful UI Components:** Built with Radix UI primitives and Tailwind CSS
- **Interactive Visualizations:** Charts and graphs using Recharts
- **Smooth Animations:** Enhanced with TailwindCSS Animate and TSParticles
- **Dark Mode Support:** Eye-friendly interface for all lighting conditions

### Security & Authentication
- **Firebase Authentication:** Secure user sign-up and login
- **Email/Password & Social Auth:** Multiple authentication methods
- **Protected Routes:** Secure access to user-specific features
- **Admin Panel:** Firebase Admin SDK integration for backend operations

### Data Management
- **SQLite Database:** Efficient local data storage
- **Analysis History:** Save and review past scans
- **User Profiles:** Personalized dietary preferences and restrictions
- **Offline Support:** Access previously analyzed products without internet

---

## Tech Stack

### Frontend Framework
| Technology | Version | Purpose |
|-----------|---------|---------|
| **[Next.js](https://nextjs.org/)** | 15.3.3 | React framework with App Router and Turbopack |
| **[React](https://react.dev/)** | 18.3.1 | Component-based UI library |
| **[TypeScript](https://www.typescriptlang.org/)** | 5.x | Type-safe development |

### Styling & UI Components
| Technology | Version | Purpose |
|-----------|---------|---------|
| **[Tailwind CSS](https://tailwindcss.com/)** | 3.4.1 | Utility-first CSS framework |
| **[Radix UI](https://www.radix-ui.com/)** | Various | Accessible component primitives |
| **[Lucide React](https://lucide.dev/)** | 0.475.0 | Beautiful icon library |
| **[TailwindCSS Animate](https://www.npmjs.com/package/tailwindcss-animate)** | 1.0.7 | Animation utilities |
| **[TSParticles](https://particles.js.org/)** | 3.0.0+ | Interactive particle effects |

### AI & Backend Services
| Technology | Version | Purpose |
|-----------|---------|---------|
| **[Google Gemini AI](https://deepmind.google/technologies/gemini/)** | Latest | Multimodal AI for image and text analysis |
| **[Firebase Genkit](https://firebase.google.com/docs/genkit)** | 1.8.0 | AI workflow framework |
| **[@genkit-ai/googleai](https://www.npmjs.com/package/@genkit-ai/googleai)** | 1.8.0 | Google AI plugin for Genkit |
| **[@genkit-ai/next](https://www.npmjs.com/package/@genkit-ai/next)** | 1.8.0 | Next.js integration for Genkit |

### Authentication & Database
| Technology | Version | Purpose |
|-----------|---------|---------|
| **[Firebase](https://firebase.google.com/)** | 10.12.2 | Client-side authentication and services |
| **[Firebase Admin](https://firebase.google.com/docs/admin/setup)** | 12.2.0 | Server-side Firebase operations |
| **[SQLite](https://www.sqlite.org/)** | Latest | Lightweight relational database |

### Form Management & Validation
| Technology | Version | Purpose |
|-----------|---------|---------|
| **[React Hook Form](https://react-hook-form.com/)** | 7.54.2 | Performant form management |
| **[@hookform/resolvers](https://www.npmjs.com/package/@hookform/resolvers)** | 4.1.3 | Schema validation resolvers |
| **[Zod](https://zod.dev/)** | 3.24.2 | TypeScript-first schema validation |

### Data Visualization & Utilities
| Technology | Version | Purpose |
|-----------|---------|---------|
| **[Recharts](https://recharts.org/)** | 2.15.1 | React charting library |
| **[date-fns](https://date-fns.org/)** | 3.6.0 | Date manipulation library |
| **[html2canvas](https://html2canvas.hertzen.com/)** | 1.4.1 | Screenshot generation |
| **[React Day Picker](https://react-day-picker.js.org/)** | 8.10.1 | Date picker component |

### Development Tools
| Technology | Version | Purpose |
|-----------|---------|---------|
| **[ESLint](https://eslint.org/)** | 8.x | Code linting and quality |
| **[PostCSS](https://postcss.org/)** | 8.x | CSS transformations |
| **[Genkit CLI](https://firebase.google.com/docs/genkit)** | 1.8.0 | AI development and testing |

---

## Installation & Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher
- **Yarn** 1.22+ (specified package manager)
- **Git** for version control

### Required API Keys & Services

1. **Google Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Keep it secure for environment configuration

2. **Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing one
   - Enable Authentication (Email/Password, Google Sign-in)
   - Generate Web App credentials
   - Download Firebase Admin Service Account JSON

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/uffamit/eatinformed.git
   cd eatinformed
   ```

2. **Install Dependencies**
   ```bash
   yarn install
   ```

3. **Environment Configuration**

   Create a `.env.local` file in the root directory:

   ```env
   # Google Gemini AI
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
   GOOGLE_GENAI_API_KEY=your_gemini_api_key_here

   # Firebase Client Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Firebase Admin SDK (Server-side)
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----\n"

   # Application Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:9003
   NODE_ENV=development
   ```

   **Important:** Replace all placeholder values with your actual credentials.

4. **Firebase Setup**

   - Enable Authentication methods in Firebase Console
   - Set up Firestore Database (if using)
   - Configure Firebase Storage for image uploads
   - Add authorized domains for authentication

5. **Database Initialization**

   The SQLite database will be automatically created on first run. To manually initialize:

   ```bash
   # Database file: database.sqlite
   # Schema will be created automatically by the application
   ```

6. **Run Development Server**

   ```bash
   # Start Next.js development server with Turbopack
   yarn dev
   ```

   The application will be available at [http://localhost:9003](http://localhost:9003)

7. **Run Genkit Development Server (Optional)**

   For AI workflow development and testing:

   ```bash
   yarn genkit:watch
   ```

   This starts the Genkit Developer UI for testing AI flows.

---

## Available Scripts

```bash
# Development
yarn dev                 # Start Next.js dev server with Turbopack on port 9003
yarn genkit:watch       # Watch and run Genkit AI flows in development mode

# Production
yarn build              # Build optimized production bundle
yarn start              # Start production server

# Code Quality
yarn lint               # Run ESLint with strict settings (max-warnings=0)
yarn typecheck          # Run TypeScript compiler checks without emitting files

# Package Management
yarn install            # Install dependencies
yarn add <package>      # Add new dependency
```

---

## Project Structure

```
eatinformed/
├── .github/                 # GitHub configuration and workflows
├── .idx/                    # IDX configuration
├── .vscode/                 # VS Code settings
├── docs/                    # Documentation files
├── src/
│   ├── ai/                  # AI integration layer
│   │   ├── flows/          # Genkit AI flows and prompts
│   │   ├── dev.ts          # Genkit development configuration
│   │   └── genkit.ts       # Genkit initialization and setup
│   ├── app/                 # Next.js App Router pages and layouts
│   │   ├── (auth)/         # Authentication routes
│   │   ├── (dashboard)/    # Protected dashboard routes
│   │   ├── api/            # API routes and endpoints
│   │   ├── layout.tsx      # Root layout component
│   │   └── page.tsx        # Home page
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components (Radix UI)
│   │   ├── forms/          # Form components
│   │   ├── layouts/        # Layout components
│   │   └── features/       # Feature-specific components
│   ├── context/            # React Context providers
│   │   ├── AuthContext.tsx # Authentication context
│   │   └── ThemeContext.tsx # Theme management
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication hook
│   │   ├── useFirebase.ts  # Firebase utilities
│   │   └── useAnalysis.ts  # Food analysis hook
│   ├── lib/                # Utility libraries and configurations
│   │   ├── firebase.ts     # Firebase client initialization
│   │   ├── firebase-admin.ts # Firebase Admin SDK setup
│   │   └── utils.ts        # Helper functions
│   ├── types/              # TypeScript type definitions
│   │   ├── analysis.ts     # Food analysis types
│   │   ├── user.ts         # User-related types
│   │   └── index.ts        # Exported types
│   └── utils/              # Utility functions
│       ├── validation.ts   # Zod schemas
│       └── formatters.ts   # Data formatting utilities
├── public/                  # Static assets (images, fonts, etc.)
├── .env.local              # Environment variables (create this)
├── .eslintrc.json          # ESLint configuration
├── .gitignore              # Git ignore rules
├── components.json         # shadcn/ui component configuration
├── database.sqlite         # SQLite database file
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies and scripts
├── postcss.config.mjs      # PostCSS configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               
```

---

##  Configuration Files

### Firebase Configuration (`src/lib/firebase.ts`)
- Client-side Firebase initialization
- Authentication setup
- Firestore configuration


### Firebase Admin (`src/lib/firebase-admin.ts`)
- Server-side Firebase Admin SDK
- Secure backend operations
- Token verification


### Genkit Configuration (`src/ai/genkit.ts`)
- AI model initialization
- Google AI plugin setup
- Flow registration and management

### Next.js Config (`next.config.mjs`)
- Image optimization settings
- Environment variable handling
- Build optimizations

### Tailwind Config (`tailwind.config.ts`)
- Custom color schemes
- Component styling extensions
- Animation configurations

---

##  API Routes & Endpoints

### Authentication APIs
```
POST /api/auth/signup          # Create new user account
POST /api/auth/login           # User login
POST /api/auth/logout          # User logout
POST /api/auth/reset-password  # Password reset request
```

### Analysis APIs
```
POST /api/analyze/image        # Upload and analyze food label image
GET  /api/analyze/history      # Get user's analysis history
GET  /api/analyze/:id          # Get specific analysis result
DELETE /api/analyze/:id        # Delete analysis result
```

### User APIs
```
GET  /api/user/profile         # Get user profile
PUT  /api/user/profile         # Update user profile
GET  /api/user/preferences     # Get dietary preferences
PUT  /api/user/preferences     # Update dietary preferences
```

### Genkit AI Flows
```
POST /api/genkit/analyze-label    # AI-powered label analysis flow
POST /api/genkit/extract-nutrients # Extract nutritional information
POST /api/genkit/identify-allergens # Detect allergens in ingredients
```

---

##  Firebase Services Used

### Authentication
- **Email/Password Authentication**
- **Google Sign-In**
- **Password Reset & Email Verification**
- **Session Management**

### Firestore Database (Optional)
- **User Profiles**: Store user information and preferences
- **Analysis Results**: Save food label analysis history
- **Favorites**: Bookmark frequently scanned products

### Firebase Storage (Optional)
- **Image Uploads**: Store original food label images
- **Report Generation**: Save PDF reports of analyses

### Firebase Admin SDK
- **Server-side Authentication**: Verify user tokens
- **Database Operations**: Secure backend data access
- **User Management**: Admin operations

---

##  AI Integration Details

### Google Gemini AI
- **Model**: Gemini Pro Vision (multimodal)
- **Capabilities**:
  - Image recognition and OCR
  - Natural language understanding
  - Contextual analysis of ingredients
  - Nutritional data extraction

### Genkit Framework
- **AI Flow Management**: Structured workflows for analysis
- **Prompt Engineering**: Optimized prompts for accurate results
- **Streaming Responses**: Real-time result delivery
- **Error Handling**: Robust fallback mechanisms

### Analysis Pipeline
1. **Image Upload** → User uploads food label photo
2. **Preprocessing** → Image optimization and validation
3. **AI Analysis** → Gemini processes image and extracts data
4. **Data Structuring** → Genkit organizes results
5. **Health Assessment** → AI evaluates nutritional impact
6. **User Presentation** → Results displayed with visualizations

---

##  Features in Detail

### Nutritional Analysis
- Calorie breakdown (per serving and per 100g)
- Macronutrients (carbs, proteins, fats)
- Micronutrients (vitamins, minerals)
- Daily value percentages
- Comparison with recommended intake

### Ingredient Intelligence
- Complete ingredient list extraction
- Identification of artificial additives
- E-number explanation and health impacts
- Natural vs. synthetic ingredient classification
- Allergen highlighting

### Health Risk Assessment
- Traffic light system (red/yellow/green)
- Harmful additive warnings
- Sugar and sodium level alerts
- Trans fat detection
- Preservative analysis

### Dietary Compliance Checker
-  Vegan-friendly verification
-  Vegetarian compatibility
-  Gluten-free confirmation
-  Keto/Low-carb suitability
-  Halal/Kosher compliance
-  Allergen warnings (nuts, dairy, soy, etc.)

---

##  UI Components

Built with **Radix UI** primitives for accessibility and **Tailwind CSS** for styling:

- **Accordion** - Collapsible content sections
- **Alert Dialog** - Confirmation modals
- **Avatar** - User profile images
- **Checkbox** - Form selections
- **Dialog** - Modal windows
- **Dropdown Menu** - Context menus
- **Label** - Form labels
- **Menubar** - Navigation menus
- **Popover** - Floating content
- **Progress** - Loading indicators
- **Radio Group** - Single selections
- **Scroll Area** - Scrollable regions
- **Select** - Dropdown selections
- **Separator** - Visual dividers
- **Slider** - Range inputs
- **Switch** - Toggle controls
- **Tabs** - Tabbed interfaces
- **Toast** - Notifications
- **Tooltip** - Hover hints

---

##  Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Environment Variables
Ensure all environment variables are configured in your deployment platform:
- Vercel Dashboard → Project Settings → Environment Variables
- Add all variables from `.env.local`

### Build Optimization
- Automatic image optimization
- Static page generation where possible
- API route caching
- CDN distribution

---

##  Contributing

Contributions make the open-source community thrive! Any contributions you make are **greatly appreciated**.

### How to Contribute

1. **Fork the Project**
   ```bash
   # Click the 'Fork' button on GitHub
   ```

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/your-username/eatinformed.git
   cd eatinformed
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```

4. **Make Your Changes**
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m 'Add some AmazingFeature'
   ```

6. **Push to Your Branch**
   ```bash
   git push origin feature/AmazingFeature
   ```

7. **Open a Pull Request**
   - Go to the original repository
   - Click 'New Pull Request'
   - Describe your changes

### Code Style Guidelines
- Use TypeScript strict mode
- Follow ESLint rules (`yarn lint`)
- Write meaningful commit messages
- Add JSDoc comments for complex functions

---

##  Known Issues & Limitations

- Image analysis accuracy depends on photo quality
- Some obscure ingredients may not be recognized
- OCR may struggle with handwritten labels
- Analysis time varies based on image size (typically 3-10 seconds)

---

## ️ Roadmap

- [ ] Multi-language support for international labels
- [ ] Barcode scanning integration
- [ ] Product comparison feature
- [ ] Mobile app (React Native)
- [ ] Recipe suggestions based on dietary preferences
- [ ] Social sharing and community features
- [ ] Integration with fitness tracking apps
- [ ] Offline mode with service workers
- [ ] Voice input for hands-free operation

---

##  License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

##  Acknowledgments

- **[Google Gemini](https://deepmind.google/technologies/gemini/)** for powerful AI capabilities
- **[Firebase](https://firebase.google.com/)** for backend infrastructure and authentication
- **[Next.js Team](https://nextjs.org/)** for an excellent React framework
- **[Radix UI](https://www.radix-ui.com/)** for accessible component primitives
- **[Vercel](https://vercel.com/)** for seamless deployment platform
- **[shadcn/ui](https://ui.shadcn.com/)** for beautiful component designs

---

##  Contact & Support

**Admin** - [@uffamit](https://github.com/uffamit)

**Project Link:** [https://github.com/uffamit/eatinformed](https://github.com/uffamit/eatinformed)

### Get Help
-  [Report a Bug](https://github.com/uffamit/eatinformed/issues)
-  [Request a Feature](https://github.com/uffamit/eatinformed/issues)
-  [View Documentation](https://github.com/uffamit/eatinformed/tree/master/docs)

---

##  Stats

![TypeScript](https://img.shields.io/badge/TypeScript-97.7%25-blue)
![CSS](https://img.shields.io/badge/CSS-1.5%25-563d7c)
![Other](https://img.shields.io/badge/Other-0.8%25-lightgrey)

---

<p align="center">
  <strong>Made with ️ for healthier food choices</strong>
  <br>
  <sub>Powered by Google Gemini AI & Firebase</sub>
</p>

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-installation--setup">Setup</a> •
  <a href="#-api-routes--endpoints">API</a> •
  <a href="#-contributing">Contributing</a> •
  <a href="#-license">License</a>
</p>
