import { LoginForm } from "@/components/public/auth/login-form";
import RedirectIfLoggedIn from "./RedirectIfLoggedIn";

export default function Login() {
  return (
    <div className="flex w-full justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <RedirectIfLoggedIn>
          <LoginForm />
        </RedirectIfLoggedIn>
      </div>
    </div>
  );
}
