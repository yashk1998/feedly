# Growero Frontend

Modern React frontend for the Growero RSS SaaS platform built with Vite, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern UI/UX**: Clean, responsive design with Tailwind CSS
- **Authentication**: Clerk integration for secure user management
- **Real-time Updates**: React Query for efficient data fetching and caching
- **AI Integration**: Article summarization and social media post generation
- **Team Collaboration**: Multi-user support with role-based access
- **Mobile Responsive**: Works perfectly on all devices
- **Dark/Light Mode**: User preference support (coming soon)

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Clerk** - Authentication and user management
- **Zustand** - State management
- **Framer Motion** - Animations
- **Lucide React** - Beautiful icons

## 📦 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` and add your Clerk publishable key:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.tsx      # Main navigation
│   └── ProtectedRoute.tsx # Auth wrapper
├── pages/              # Page components
│   ├── LandingPage.tsx # Public landing page
│   ├── Dashboard.tsx   # Main feed dashboard
│   ├── FeedManagement.tsx # RSS feed management
│   ├── ArticleReader.tsx  # Article reading interface
│   ├── Settings.tsx    # User settings
│   └── Pricing.tsx     # Pricing page
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── App.tsx             # Main app component
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

## 🎨 Styling

The application uses Tailwind CSS with a custom design system:

- **Primary Colors**: Blue palette (`primary-50` to `primary-900`)
- **Gray Scale**: Neutral grays for text and backgrounds
- **Components**: Pre-built component classes in `index.css`
- **Responsive**: Mobile-first responsive design
- **Animations**: Smooth transitions and micro-interactions

### Custom CSS Classes

```css
.btn              # Base button styles
.btn-primary      # Primary button variant
.btn-secondary    # Secondary button variant
.btn-outline      # Outline button variant
.card             # Card container
.input            # Form input styles
```

## 🔐 Authentication

Authentication is handled by Clerk with the following features:

- **Sign In/Sign Up**: Modal-based authentication
- **Protected Routes**: Automatic redirection for unauthenticated users
- **User Management**: Profile management through Clerk
- **Session Handling**: Automatic token refresh

### Usage

```tsx
import { useAuth, useUser } from '@clerk/clerk-react'

function MyComponent() {
  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()
  
  if (!isSignedIn) {
    return <div>Please sign in</div>
  }
  
  return <div>Welcome {user?.firstName}!</div>
}
```

## 📡 API Integration

The frontend communicates with the backend through REST APIs using Axios and React Query:

### API Client Setup

```tsx
import axios from 'axios'

// Automatic proxy to backend in development
const api = axios.create({
  baseURL: '/api'
})
```

### React Query Usage

```tsx
import { useQuery, useMutation } from 'react-query'

// Fetching data
const { data, isLoading, error } = useQuery('feeds', fetchFeeds)

// Mutations
const addFeedMutation = useMutation(addFeed, {
  onSuccess: () => {
    queryClient.invalidateQueries('feeds')
  }
})
```

## 🧩 Key Components

### Dashboard
- Article feed with infinite scroll
- Sidebar with filters and quick actions
- Real-time updates every minute
- Search and category filtering

### Feed Management
- Add RSS feeds with URL validation
- Popular feed suggestions
- Feed status and article counts
- Refresh and delete operations

### Article Reader
- Clean reading interface
- AI-powered summaries
- Social media post generation
- Copy to clipboard functionality

### Settings
- User profile management
- Notification preferences
- Billing and subscription info
- Team management (Pro/Power plans)

## 🎯 State Management

The application uses a combination of:

- **React Query**: Server state and caching
- **Zustand**: Client-side state (if needed)
- **React State**: Component-level state
- **Clerk**: Authentication state

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- **Mobile**: `< 768px`
- **Tablet**: `768px - 1024px`
- **Desktop**: `> 1024px`

Key responsive features:
- Collapsible navigation on mobile
- Responsive grid layouts
- Touch-friendly interactions
- Optimized text sizes

## 🚀 Build and Deployment

### Development
```bash
npm run dev          # Start dev server
npm run lint         # Run ESLint
```

### Production
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Environment Variables

Required environment variables:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...  # Clerk authentication
```

## 🧪 Testing

Testing setup (to be implemented):

```bash
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run test:coverage # Generate coverage report
```

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow React hooks patterns
- Use functional components only
- Implement proper error boundaries
- Add proper TypeScript types

### Component Guidelines
- Keep components small and focused
- Use composition over inheritance
- Implement proper prop types
- Add JSDoc comments for complex components
- Follow accessibility best practices

### Performance
- Use React.memo for expensive components
- Implement proper loading states
- Use React Query for caching
- Optimize images and assets
- Minimize bundle size

## 🐛 Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check Clerk publishable key in `.env.local`
   - Verify Clerk dashboard configuration

2. **API calls failing**
   - Ensure backend server is running on port 3001
   - Check network tab for CORS issues

3. **Styling not loading**
   - Verify Tailwind CSS is properly configured
   - Check PostCSS configuration

4. **Build errors**
   - Clear node_modules and reinstall
   - Check TypeScript errors
   - Verify all imports are correct

## 📝 Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test on multiple screen sizes
4. Update documentation for new features
5. Follow commit message conventions

## 🔗 Related

- [Backend README](../server/README.md)
- [API Documentation](../server/README.md#api-endpoints)
- [Deployment Guide](../../docs/deployment.md)

## 📄 License

This project is part of the Growero RSS SaaS platform. 