import { ThemeToggle } from "./ThemeToggle";

export const Header = () => {
  return (
    <header className="bg-gradient-to-r from-primary to-primary-glow shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground">LeadFlow</h1>
            <p className="text-primary-foreground/80 text-sm">Smart Lead Management</p>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="text-right">
              <p className="text-white text-sm font-medium">Welcome back!</p>
              <p className="text-primary-foreground/80 text-xs">Manage your leads efficiently</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
