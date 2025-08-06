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

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        // Connexion automatique après inscription
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.ok) {
          toast.success("Compte créé avec succès !");
          router.push("/onboarding");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Une erreur est survenue");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-airbnb-light-gray to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-airbnb-red rounded-md flex items-center justify-center mr-3">
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
          {/* Sign Up Card */}
          <div className="airbnb-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-airbnb-charcoal mb-2">
                Créer un compte
              </h2>
              <p className="text-airbnb-dark-gray">
                Commencez à gérer vos réservations
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label
                  htmlFor="name"
                  className="block text-sm font-medium text-airbnb-charcoal mb-2"
                >
                  Nom complet
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="airbnb-input"
                  placeholder="Jean Dupont"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="email"
                  className="block text-sm font-medium text-airbnb-charcoal mb-2"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="airbnb-input"
                  placeholder="••••••••"
                  required
                />
                <p className="text-xs text-airbnb-dark-gray mt-1">
                  Au moins 6 caractères
                </p>
              </div>

              <div>
                <Label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-airbnb-charcoal mb-2"
                >
                  Confirmer le mot de passe
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="airbnb-input"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-airbnb-red hover:bg-airbnb-dark-red text-white py-3 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Création du compte..." : "Créer mon compte"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-airbnb-dark-gray">
                Déjà un compte ?{" "}
                <Link
                  href="/auth/signin"
                  className="text-airbnb-red hover:text-airbnb-dark-red font-medium transition-colors"
                >
                  Se connecter
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

            {/* Alternative Sign Up Options */}
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

            {/* Terms */}
            <div className="mt-6 text-center">
              <p className="text-xs text-airbnb-dark-gray">
                En créant un compte, vous acceptez nos{" "}
                <Link
                  href="/terms"
                  className="text-airbnb-red hover:text-airbnb-dark-red underline"
                >
                  Conditions d&apos;utilisation
                </Link>{" "}
                et notre{" "}
                <Link
                  href="/privacy"
                  className="text-airbnb-red hover:text-airbnb-dark-red underline"
                >
                  Politique de confidentialité
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
