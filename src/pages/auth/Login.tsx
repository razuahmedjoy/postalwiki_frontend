import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogin } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const login = useLogin();
    const { isAuthenticated } = useAuthStore();

    const from = location.state?.from?.pathname || '/dashboard';

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            await login.mutateAsync({ username, password });
            toast({
                title: "Login successful",
                description: "Welcome back!",
            });
            navigate(from, { replace: true });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Login failed",
                description: "Invalid username or password",
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 space-y-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-bold">Login</h1>
                    <p className="text-muted-foreground">
                        Enter your credentials to access your account
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="username" className="text-sm font-medium">
                            Username
                        </label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium">
                            Password
                        </label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={login.isPending}
                    >
                        {login.isPending ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
            </Card>
        </div>
    );
} 