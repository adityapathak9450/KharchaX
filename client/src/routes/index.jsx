import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RouteSkeleton } from '../components/auth/RouteSkeleton'
import { ProtectedRoute } from './ProtectedRoute'


const LandingPage = lazy(() => import('../pages/LandingPage.jsx'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage.jsx'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage.jsx'))
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage.jsx'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage.jsx'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage.jsx'))
const DashboardLayout = lazy(() => import('../layouts/DashboardLayout.jsx'))
const DashboardHome = lazy(() => import('../pages/dashboard/DashboardHome.jsx'))
const WalletsPage = lazy(() => import('../pages/dashboard/WalletsPage.jsx'))
const WalletDetailPage = lazy(() => import('../pages/dashboard/WalletDetailPage.jsx'))
const TransactionsPage = lazy(() => import('../pages/dashboard/TransactionsPage.jsx'))
const BudgetsPage = lazy(() => import('../pages/dashboard/BudgetsPage.jsx'))
const AnalyticsPage = lazy(() => import('../pages/dashboard/AnalyticsPage.jsx'))
const NotificationsPage = lazy(() => import('../pages/dashboard/NotificationsPage.jsx'))
const SharedWalletsPage = lazy(() => import('../pages/dashboard/SharedWalletsPage.jsx'))
const SharedWalletDetailPage = lazy(() => import('../pages/dashboard/SharedWalletDetailPage.jsx'))
const RecurringPaymentsPage = lazy(() => import('../pages/dashboard/RecurringPaymentsPage.jsx'))
const ReportsPage = lazy(() => import('../pages/dashboard/ReportsPage.jsx'))
const SettingsPage = lazy(() => import('../pages/dashboard/SettingsPage.jsx'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'))

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
            <Route path="wallets" element={<WalletsPage />} />
            <Route path="wallets/:id" element={<WalletDetailPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="shared-wallets" element={<SharedWalletsPage />} />
            <Route path="shared-wallets/:id" element={<SharedWalletDetailPage />} />
            <Route path="recurring" element={<RecurringPaymentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
