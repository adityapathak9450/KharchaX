import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RouteSkeleton } from '../components/auth/RouteSkeleton.jsx'
import { ProtectedRoute } from './ProtectedRoute.jsx'

const LandingPage = lazy(() => import('../pages/LandingPage.jsx'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage.jsx'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage.jsx'))
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage.jsx'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage.jsx'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage.jsx'))
const DashboardLayout = lazy(() => import('../layouts/DashboardLayout.jsx'))
const DashboardHome = lazy(() => import('../pages/dashboard/DashboardHome.jsx'))

export function AppRouter() {
  return (
    <Suspense fallback={<RouteSkeleton />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
