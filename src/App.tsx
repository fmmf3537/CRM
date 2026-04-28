import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { useIsMobile } from './hooks/useMediaQuery'
import Layout from './components/Layout'
import MobileLayout from './components/mobile/MobileLayout'

// Eagerly loaded (critical paths)
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

// Lazy loaded pages
const Customers = lazy(() => import('./pages/Customers'))
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'))
const Leads = lazy(() => import('./pages/Leads'))
const LeadDetail = lazy(() => import('./pages/LeadDetail'))
const Activities = lazy(() => import('./pages/Activities'))
const Workload = lazy(() => import('./pages/Workload'))
const Projects = lazy(() => import('./pages/Projects'))
const Opportunities = lazy(() => import('./pages/Opportunities'))
const OpportunityDetail = lazy(() => import('./pages/OpportunityDetail'))
const Pipeline = lazy(() => import('./pages/Pipeline'))
const Targets = lazy(() => import('./pages/Targets'))
const Achievements = lazy(() => import('./pages/Achievements'))
const Performance = lazy(() => import('./pages/Performance'))
const Settings = lazy(() => import('./pages/Settings'))
const Notifications = lazy(() => import('./pages/Notifications'))
const AdminUsers = lazy(() => import('./pages/admin/Users'))
const AdminConfig = lazy(() => import('./pages/admin/Config'))

// Mobile pages
const MobileHome = lazy(() => import('./pages/mobile/Home'))
const MobileCustomerList = lazy(() => import('./pages/mobile/CustomerList'))
const MobileCustomerDetail = lazy(() => import('./pages/mobile/CustomerDetail'))
const MobileActivityQuick = lazy(() => import('./pages/mobile/ActivityQuick'))
const MobileMe = lazy(() => import('./pages/mobile/Me'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  const isMobile = useIsMobile()

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Desktop Layout */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              {isMobile ? <MobileLayout /> : <Layout />}
            </PrivateRoute>
          }
        >
          <Route index element={isMobile ? <MobileHome /> : <Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="activities" element={<Activities />} />
          <Route path="workload" element={<Workload />} />
          <Route path="projects" element={<Projects />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="opportunities/:id" element={<OpportunityDetail />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="targets" element={<Targets />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="performance" element={<Performance />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="admin/config" element={<AdminRoute><AdminConfig /></AdminRoute>} />
        </Route>

        {/* Mobile Routes */}
        <Route
          path="/mobile"
          element={
            <PrivateRoute>
              <MobileLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<MobileHome />} />
          <Route path="customers" element={<MobileCustomerList />} />
          <Route path="customers/:id" element={<MobileCustomerDetail />} />
          <Route path="activities" element={<MobileActivityQuick />} />
          <Route path="me" element={<MobileMe />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
