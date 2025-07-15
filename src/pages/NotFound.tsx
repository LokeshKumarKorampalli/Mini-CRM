import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  return (
    <div className="h-screen flex items-center justify-center text-center">
      <div>
        <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
        <p className="mt-4 text-muted-foreground">
          Oops! The page you are looking for doesn’t exist.
        </p>
      </div>
    </div>
  );
};

export default NotFound;