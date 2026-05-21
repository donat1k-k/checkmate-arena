import AuthForm from "@/components/auth/AuthForm";

export default function SignInPage() {
  return (
    <div className="mx-auto grid max-w-md py-4 sm:py-10">
      <AuthForm mode="sign-in" />
    </div>
  );
}
