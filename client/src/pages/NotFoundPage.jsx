import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function NotFoundPage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-canvas text-foreground px-6">
      <h1 className="text-8xl font-bold text-primary">404</h1>

      <h2 className="mt-4 text-3xl font-semibold">
        Page Not Found
      </h2>

      <p className="mt-3 text-muted text-center max-w-md">
        Sorry, the page you're looking for doesn't exist.
      </p>

      <Link
        to={isAuthenticated ? "/dashboard" : "/"}
        className="btn-primary mt-8 px-6 py-3"
      >
        {isAuthenticated ? "Back to Dashboard" : "Back to Home"}
      </Link>
    </div>
  );
}