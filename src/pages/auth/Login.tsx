import { LoginForm } from "@/components/public/auth/login-form";

export default function Login() {
  return (
    <div className="flex w-full justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
