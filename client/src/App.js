import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import DashboardShell from './components/DashboardShell';
import AdminShell from './components/AdminShell';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ResourceDetailPage from './pages/ResourceDetailPage';
import ResourceUploadPage from './pages/ResourceUploadPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ContactPage from './pages/ContactPage';
import ConnectionsPage from './pages/ConnectionsPage';
import EarningsPage from './pages/EarningsPage';
import CartPage from './pages/CartPage';
import LibraryPage from './pages/LibraryPage';
import SettingsPage from './pages/SettingsPage';
import StudentPerformancePage from './pages/StudentPerformancePage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminResourcesPage from './pages/admin/AdminResourcesPage';
import AdminCommentsPage from './pages/admin/AdminCommentsPage';
import AdminInquiriesPage from './pages/admin/AdminInquiriesPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminModerationPage from './pages/admin/AdminModerationPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import InquiriesPage from './pages/InquiriesPage';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import BillingPage from './pages/BillingPage';

function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/contact" element={<ContactPage />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={['student']} fallbackByRole={{ admin: '/admin/dashboard' }}>
                  <DashboardShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<EarningsPage />} />
              <Route path="/earnings" element={<EarningsPage />} />
              <Route path="/browse" element={<HomePage />} />
              <Route path="/home" element={<Navigate to="/browse" replace />} />
              <Route path="/resource/:id" element={<ResourceDetailPage />} />
              <Route path="/upload" element={<ResourceUploadPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/orders" element={<Navigate to="/billing" replace />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/analytics" element={<StudentPerformancePage />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/inquiries" element={<InquiriesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<Navigate to="/settings" replace />} />
              <Route path="/connections" element={<ConnectionsPage />} />
            </Route>

            <Route
              element={
                <AdminRoute>
                  <AdminShell />
                </AdminRoute>
              }
            >
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/resources" element={<AdminResourcesPage />} />
              <Route path="/admin/comments" element={<AdminCommentsPage />} />
              <Route path="/admin/inquiries" element={<AdminInquiriesPage />} />
              <Route path="/admin/payments" element={<AdminPaymentsPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
              <Route path="/admin/moderation" element={<AdminModerationPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
