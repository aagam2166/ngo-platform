import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import type { RootState } from '../store';

interface Props {
    children: React.ReactNode;
    allowedRoles: string[];
}

export default function RoleRoute({children, allowedRoles }: Props) {
    const {isAuthenticated, user} = useSelector((s: RootState) => s.auth);

    if (!isAuthenticated || !user) return <Navigate to="/login" replace/>;
    if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace/>;

    return <>{children}</>;
}