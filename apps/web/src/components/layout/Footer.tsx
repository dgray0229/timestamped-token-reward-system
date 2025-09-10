import React from 'react';

/**
 * Footer Component
 * 
 * This component provides the footer for the application with:
 * - Project information and description
 * - Educational links and resources
 * - Social links (if applicable)
 * - Copyright information
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/50">
      <div className="container-responsive py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Project Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">
              Timestamped Token Reward System
            </h3>
            <p className="text-sm text-muted-foreground">
              A tutorial application demonstrating Solana blockchain integration 
              with modern React frontend and Node.js backend.
            </p>
          </div>

          {/* Educational Links */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Learn More</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://docs.solana.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Solana Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://book.anchor-lang.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Anchor Framework
                </a>
              </li>
              <li>
                <a
                  href="https://react.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  React Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://redux-toolkit.js.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Redux Toolkit
                </a>
              </li>
            </ul>
          </div>

          {/* Technical Stack */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Built With</h4>
            <div className="flex flex-wrap gap-2">
              {[
                'React',
                'TypeScript',
                'Solana',
                'Anchor',
                'Redux Toolkit',
                'Tailwind CSS',
                'Vite',
              ].map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Timestamped Token Reward System. 
            Built for educational purposes.
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Version 1.0.0</span>
            <span>•</span>
            <span>
              Network: {import.meta.env.VITE_SOLANA_NETWORK || 'devnet'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}