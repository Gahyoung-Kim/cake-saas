import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import DashboardPage from './pages/DashboardPage';
import OrderExtract from './pages/OrderExtract';
import CalendarPage from './pages/CalendarPage';
import OrderForm from './pages/OrderForm';
import PublicOrderForm from './pages/PublicOrderForm';
import Settings from './pages/Settings';
import ReservationListPage from './pages/ReservationListPage';
import CustomerListPage from './pages/CustomerListPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/login"       element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="/order/:slug" element={<PublicOrderForm />} />

        {/* 인증 필요 라우트 */}
        <Route path="/"             element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/extract"      element={<PrivateRoute><OrderExtract /></PrivateRoute>} />
        <Route path="/calendar"     element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
        <Route path="/reservations" element={<PrivateRoute><ReservationListPage /></PrivateRoute>} />
        <Route path="/customers"    element={<PrivateRoute><CustomerListPage /></PrivateRoute>} />
        <Route path="/order-form"   element={<PrivateRoute><OrderForm /></PrivateRoute>} />
        <Route path="/settings"     element={<PrivateRoute><Settings /></PrivateRoute>} />

        {/* 404 → 홈으로 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
