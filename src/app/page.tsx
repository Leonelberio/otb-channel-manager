import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-airbnb-light-gray to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-airbnb-charcoal mb-6">
            OTB Channel Manager
          </h1>
          <p className="text-xl text-airbnb-dark-gray mb-12 max-w-2xl mx-auto">
            Gérez vos propriétés, réservations et planning en toute simplicité.
            Une solution moderne inspirée par les meilleures pratiques du
            secteur.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="airbnb" size="lg">
              <Link href="/auth/signup">Commencer gratuitement</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/signin">Se connecter</Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="airbnb-card p-8 text-center">
            <div className="w-16 h-16 bg-airbnb-red rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-8 0H3m2 0h6m-8 0v-2a2 2 0 012-2h2m6 0h2a2 2 0 012 2v2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-airbnb-charcoal mb-3">
              Gestion des Propriétés
            </h3>
            <p className="text-airbnb-dark-gray">
              Organisez vos chambres et espaces avec une interface intuitive
            </p>
          </div>

          <div className="airbnb-card p-8 text-center">
            <div className="w-16 h-16 bg-airbnb-red rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-airbnb-charcoal mb-3">
              Planning Intelligent
            </h3>
            <p className="text-airbnb-dark-gray">
              Synchronisation Google Calendar et gestion des disponibilités
            </p>
          </div>

          <div className="airbnb-card p-8 text-center">
            <div className="w-16 h-16 bg-airbnb-red rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-airbnb-charcoal mb-3">
              Réservations
            </h3>
            <p className="text-airbnb-dark-gray">
              Suivez et gérez toutes vos réservations en temps réel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
