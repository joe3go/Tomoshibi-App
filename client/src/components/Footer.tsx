
interface FooterProps {
  className?: string;
  showLinks?: boolean;
}

export default function Footer({ className = "", showLinks = true }: FooterProps) {
  return (
    <footer className={`bg-secondary text-center p-4 ${className}`}>
      <p className="text-muted-foreground">
        &copy; {new Date().getFullYear()} Tomoshibi. All rights reserved.
      </p>
      {showLinks && (
        <div className="flex justify-center space-x-4 mt-2">
          <a href="/contact" className="text-muted-foreground hover:text-primary text-sm">
            Contact Us
          </a>
          <a href="/privacy" className="text-muted-foreground hover:text-primary text-sm">
            Privacy
          </a>
          <a href="/terms" className="text-muted-foreground hover:text-primary text-sm">
            Terms
          </a>
        </div>
      )}
    </footer>
  );
}
