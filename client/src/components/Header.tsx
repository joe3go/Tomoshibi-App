
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showNavigation?: boolean;
  showSignIn?: boolean;
  onSignInClick?: () => void;
}

export default function Header({ 
  title = "Tomoshibi", 
  subtitle = "灯火", 
  showNavigation = false, 
  showSignIn = false,
  onSignInClick 
}: HeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <nav className="navbar">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <span className="text-lg font-japanese text-muted-foreground">{subtitle}</span>}
        </div>
        
        {showNavigation && (
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="text-primary-foreground hover:text-primary-foreground/80"
            >
              Home
            </Button>
            <Button
              variant="ghost"
              onClick={() => setLocation('/vocabulary')}
              className="text-primary-foreground hover:text-primary-foreground/80"
            >
              Vocabulary
            </Button>
          </div>
        )}
        
        {showSignIn && (
          <Button
            onClick={onSignInClick || (() => setLocation("/login"))}
            className="btn-primary"
          >
            Sign In
          </Button>
        )}
      </div>
    </nav>
  );
}
