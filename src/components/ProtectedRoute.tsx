import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useGetMe } from '@/api/auth';
import { Loader } from '@/components/ui/loader';
interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();
    const { isLoading } = useGetMe();

    if (isLoading) {
        return <Loader />; // You can replace this with a proper loading component
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
} 