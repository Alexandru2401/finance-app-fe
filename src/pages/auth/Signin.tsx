import { SignupForm } from "@/components/public/auth/signup-form";
import RedirectIfLoggedIn from "./RedirectIfLoggedIn";

export default function SignIn() {
  return (
    <div className="flex w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <RedirectIfLoggedIn>
          <SignupForm />
        </RedirectIfLoggedIn>
      </div>
    </div>
  );
}
