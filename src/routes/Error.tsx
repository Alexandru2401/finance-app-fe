import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-7xl font-bold tracking-tight text-[#ffd649] sm:text-8xl">
        404
      </p>

      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
        Page not found
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The page you're looking for doesn't exist or has been moved. Check the
        address, or head back to your dashboard.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          asChild
          className="cursor-pointer bg-[#ffd649] text-black hover:bg-[#ffd649]/90"
        >
          <Link to="/">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}