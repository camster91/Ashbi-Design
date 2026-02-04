import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  CheckCircle2,
  Zap,
  Users,
  MessageSquare
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Zap, text: 'AI-powered response drafting' },
    { icon: Users, text: 'Smart client assignment' },
    { icon: MessageSquare, text: 'Unified inbox management' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-primary relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/10 flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-xl font-heading font-bold">Agency Hub</span>
            </div>
            
            <h2 className="text-4xl font-heading font-bold mb-4 leading-tight">
              AI-powered client request management
            </h2>
            <p className="text-primary-foreground/80 text-lg max-w-md">
              Streamline your agency workflow with intelligent automation, 
              smart assignments, and seamless collaboration.
            </p>
          </div>
          
          <div className="space-y-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5" />
                </div>
                <span className="text-primary-foreground/90">{feature.text}</span>
              </div>
            ))}
          </div>
          
          <div className="text-sm text-primary-foreground/60">
            © 2026 Agency Hub. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-heading font-bold text-foreground">Agency Hub</span>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Email field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cameron@agencyhub.com"
                    className={cn(
                      'w-full pl-11 pr-4 py-3 bg-muted border-0 rounded-xl',
                      'text-foreground placeholder:text-muted-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card',
                      'transition-all duration-200'
                    )}
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={cn(
                      'w-full pl-11 pr-12 py-3 bg-muted border-0 rounded-xl',
                      'text-foreground placeholder:text-muted-foreground',
                      'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card',
                      'transition-all duration-200'
                    )}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <button type="button" className="text-primary hover:text-primary-600 font-medium">
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 animate-shake">
                <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-destructive text-xs">!</span>
                </div>
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Sign in
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">or continue with</span>
            </div>
          </div>

          {/* Social login */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
            <Button variant="outline" className="w-full">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10S2 17.514 2 12 6.486 2 12 2zm-1.5 5v4.5H6v3h4.5V19h3v-4.5H18v-3h-4.5V7h-3z"/>
              </svg>
              Microsoft
            </Button>
          </div>

          {/* Demo credentials */}
          <div className="p-4 rounded-xl bg-muted border border-border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-foreground">Demo credentials</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium">Email:</span> cameron@agencyhub.com</p>
              <p><span className="font-medium">Password:</span> admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
