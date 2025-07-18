import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'

// Pages
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import FeedManagement from './pages/FeedManagement'
import ArticleReader from './pages/ArticleReader'
import Settings from './pages/Settings'
import Pricing from './pages/Pricing'

// Components
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/pricing" element={<Pricing />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/feeds" element={
                <ProtectedRoute>
                  <FeedManagement />
                </ProtectedRoute>
              } />
              <Route path="/article/:id" element={
                <ProtectedRoute>
                  <ArticleReader />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App 