"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Email ou mot de passe incorrect");
      } else {
        toast.success("Connexion réussie !");
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error("Erreur lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-airbnb-light-gray to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-main rounded-md flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">OTB</span>
              </div>
              <h1 className="text-xl font-semibold text-airbnb-charcoal">
                Channel Manager
              </h1>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center text-airbnb-dark-gray hover:text-airbnb-charcoal transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md">
          {/* Sign In Card */}
          <div className="airbnb-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-airbnb-charcoal mb-2">
                Connexion
              </h2>
              <p className="text-airbnb-dark-gray">
                Accédez à votre tableau de bord
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label
                  htmlFor="email"
                  className="block text-sm font-medium text-airbnb-charcoal mb-2"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="airbnb-input"
                  placeholder="votre@email.com"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="password"
                  className="block text-sm font-medium text-airbnb-charcoal mb-2"
                >
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="airbnb-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-main hover:bg-main-dark text-white py-3 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-airbnb-dark-gray">
                Pas encore de compte ?{" "}
                <Link
                  href="/auth/signup"
                  className="text-main hover:text-main-dark font-medium transition-colors"
                >
                  Créer un compte
                </Link>
              </p>
            </div>

            {/* Divider */}
            <div className="mt-8 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-airbnb-dark-gray">ou</span>
              </div>
            </div>

            {/* Alternative Sign In Options */}
            <div className="mt-6 space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-300 text-airbnb-charcoal hover:bg-gray-50 py-3"
                disabled
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuer avec Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-300 text-airbnb-charcoal hover:bg-gray-50 py-3"
                disabled
              >
                <svg
                  className="w-5 h-5 mr-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continuer avec Facebook
              </Button>
            </div>
          </div>

          {/* Additional Help */}
          <div className="mt-6 text-center">
            <p className="text-sm text-airbnb-dark-gray">
              Problème de connexion ?{" "}
              <Link
                href="/support"
                className="text-main hover:text-main-dark font-medium"
              >
                Contactez le support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
