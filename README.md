# WordWise AI

**AI-Powered Writing Assistant & Content Creation Platform**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/pranjals-projects-82cc138b/v0-word-wise-ai)
[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## Overview

WordWise AI is a modern, AI-powered writing assistant and content creation platform designed for creators, marketers, and professionals. Transform your documents into polished content, create Instagram carousels, and enhance your writing with intelligent AI assistance.

### Key Features

- **AI Writing Assistant** - Real-time grammar checking, style suggestions, and readability analysis
- **Instagram Carousel Creation** - Transform documents into engaging social media content
- **Smart Document Management** - Upload, edit, and manage multiple file formats
- **Template Intelligence** - AI-powered template recommendations
- **Content Analytics** - Writing scores and performance metrics
- **Brand Voice Insights** - Maintain consistent tone across content
- **Multi-format Export** - PDF, images, ZIP files, and direct sharing

---

## Architecture & Tech Stack

### **Frontend**
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 3.4.17 + Radix UI components
- **UI Components**: Shadcn/ui with custom brown/amber theme
- **Icons**: Lucide React
- **Animations**: Tailwind CSS Animate

### **Backend & Infrastructure**
- **API**: Next.js API routes with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk (Email, Social, SSO)
- **File Storage**: Supabase Storage
- **AI Integration**: OpenAI API for content analysis

### **Development & Deployment**
- **Package Manager**: pnpm
- **Build Tool**: Next.js built-in
- **Deployment**: Vercel with automatic deployments
- **Version Control**: Git with GitHub
- **Code Quality**: ESLint + TypeScript

---

## Quick Start

### Prerequisites

- **Node.js** >= 18.12.0 ([Download](https://nodejs.org/))
- **pnpm** >= 8.0.0 (`npm install -g pnpm`)
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/wordwise-ai.git
   cd wordwise-ai
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment variables** (see [Environment Setup](#environment-setup))

5. **Run development server**
   ```bash
   pnpm dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## Environment Setup

Create a `.env.local` file in the project root:

```bash
# === Clerk Authentication ===
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# === Supabase Database ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# === OpenAI API ===
OPENAI_API_KEY=sk-your_openai_api_key

# === Application Settings ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### **Clerk Authentication Setup**

1. Create account at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create new application
3. Configure redirect URLs:
   - **Sign-in URL**: `/sign-in`
   - **Sign-up URL**: `/sign-up`
   - **After sign-in URL**: `/`
   - **After sign-up URL**: `/`
4. Copy API keys to `.env.local`

### **Supabase Database Setup**

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Run database schema:
   ```bash
   # Navigate to SQL editor in Supabase dashboard
   # Run scripts from /scripts directory in order:
   # 1. enhanced-schema.sql
   # 2. documents-schema.sql
   # 3. complete-schema.sql
   ```
4. Configure Row Level Security (RLS) policies
5. Copy database URL and keys to `.env.local`

### **OpenAI API Setup**

1. Create account at [platform.openai.com](https://platform.openai.com)
2. Generate API key
3. Add to `.env.local`
4. Ensure billing is set up for API usage

---

## Production Deployment

### **Vercel Deployment (Recommended)**

1. **Connect repository**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login and deploy
   vercel login
   vercel --prod
   ```

2. **Configure environment variables in Vercel dashboard**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Set `NODE_ENV=production`

3. **Custom domain setup**
   ```bash
   # In Vercel dashboard
   # Domains → Add domain → Configure DNS
   ```

### **Alternative Deployment Options**

#### **Docker Deployment**
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### **AWS/Google Cloud/Azure**
```bash
# Build for production
pnpm build
pnpm start

# Or use container deployment
docker build -t wordwise-ai .
docker run -p 3000:3000 wordwise-ai
```

---

## Development Workflow

### **Available Scripts**

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript checks

# Database
pnpm db:generate  # Generate database types
pnpm db:push      # Push schema changes
pnpm db:studio    # Open database studio
```

### **Project Structure**

```
wordwise-ai/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── (auth)/            # Authentication pages
│   ├── documents/         # Document management
│   ├── editor/            # Content editor
│   └── settings/          # User settings
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── landing/          # Landing page
│   ├── documents/        # Document features
│   ├── editor/           # Editor components
│   └── auth/             # Authentication
├── lib/                   # Utility functions
│   ├── auth.ts           # Authentication helpers
│   ├── supabase.ts       # Database client
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # General utilities
├── scripts/               # Database scripts
├── public/                # Static assets
└── styles/                # Global styles
```

### **Component Architecture**

- **Page Components** (`app/`): Route-level components
- **Feature Components** (`components/`): Reusable business logic
- **UI Components** (`components/ui/`): Base design system
- **Utility Functions** (`lib/`): Shared business logic

---

## Integrations & APIs

### **Authentication (Clerk)**
```typescript
// Authentication flow
import { useUser, useAuth } from "@clerk/nextjs"

// Protected routes
export function ProtectedComponent() {
  const { isSignedIn, user } = useUser()
  // Component logic
}
```

### **Database (Supabase)**
```typescript
// Database operations
import { supabase } from "@/lib/supabase"

// Create document
const { data, error } = await supabase
  .from('documents')
  .insert({ title, content, user_id })
```

### **AI Integration (OpenAI)**
```typescript
// Content analysis
import { OpenAI } from 'openai'

const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: prompt }]
})
```

### **File Processing**
```typescript
// Document upload and processing
const processDocument = async (file: File) => {
  // Extract content based on file type
  // Store in database with metadata
  // Return processed document
}
```

---

## Monitoring & Analytics

### **Performance Monitoring**
- **Core Web Vitals**: Tracked via Vercel Analytics
- **Error Tracking**: Built-in Next.js error boundaries
- **Database Performance**: Supabase dashboard metrics

### **User Analytics**
- **Authentication Events**: Clerk dashboard
- **Feature Usage**: Custom event tracking
- **Content Metrics**: Document creation and usage stats

---

## Troubleshooting

### **Common Issues**

#### **Development Server Won't Start**
```bash
# Clear cache and reinstall
rm -rf .next node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

#### **Authentication Issues**
```bash
# Check environment variables
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY

# Verify Clerk configuration
# - Check redirect URLs in Clerk dashboard
# - Ensure middleware.ts is properly configured
```

#### **Database Connection Issues**
```bash
# Test Supabase connection
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verify RLS policies are set up correctly
```

#### **Build/Deployment Issues**
```bash
# Check TypeScript errors
pnpm type-check

# Verify environment variables in production
# Ensure all required variables are set in Vercel dashboard
```

### **Performance Optimization**

- **Images**: Use Next.js Image component with optimization
- **Fonts**: Preload fonts and use font-display: swap
- **Code Splitting**: Implement dynamic imports for large components
- **Caching**: Configure appropriate cache headers

---

## Contributing

### **Development Guidelines**

1. **Code Style**
   - Use TypeScript for all new code
   - Follow ESLint configuration
   - Use Prettier for formatting
   - Write descriptive component and function names

2. **Component Guidelines**
   - Keep components under 500 lines
   - Use functional components with hooks
   - Add JSDoc comments for complex functions
   - Prefer composition over inheritance

3. **Git Workflow**
   ```bash
   # Create feature branch
   git checkout -b feature/new-feature
   
   # Make changes and commit
   git add .
   git commit -m "feat: add new feature"
   
   # Push and create PR
   git push origin feature/new-feature
   ```

### **Pull Request Process**

1. Ensure all tests pass
2. Update documentation if needed
3. Add screenshots for UI changes
4. Request review from maintainers

---

## Roadmap

### **Phase 1: Core Features** ✓
- ► Landing page with authentication
- ► Document management system
- ► Basic AI writing assistance
- ► Instagram carousel creation

### **Phase 2: Advanced Features** (In Progress)
- ► Advanced grammar checking
- ► Brand voice analysis
- ► Template marketplace
- ► Collaboration features

### **Phase 3: Enterprise** (Planned)
- ► Team management
- ► Advanced analytics
- ► API access
- ► White-label options

---

## License & Copyright

© 2025 **Pranjal Ekhande**. All rights reserved.

This project is proprietary software. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

---

## Support & Contact

- **Author**: Pranjal Ekhande
- **Documentation**: [Project Wiki](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-username/wordwise-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/wordwise-ai/discussions)

---

## Acknowledgments

- **Next.js Team** for the excellent framework
- **Vercel** for seamless deployment
- **Clerk** for authentication infrastructure
- **Supabase** for database and storage
- **OpenAI** for AI capabilities
- **Radix UI** for accessible components
- **Tailwind CSS** for styling system

---

**Built with ❤️ by [Pranjal Ekhande](https://github.com/your-username)**
