import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { getMe } from '@/api/auth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { GalleryPage } from '@/pages/GalleryPage';
import { SharedGalleryPage } from '@/pages/SharedGalleryPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/VerifyEmailPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setUser } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      getMe().then(setUser).catch(() => useAuthStore.getState().logout());
    }
  }, [isAuthenticated, setUser]);

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors closeButton duration={3000} />
      <BrowserRouter>
        <AuthLoader>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/shared/:token" element={<SharedGalleryPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/gallery/:id" element={<GalleryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthLoader>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
