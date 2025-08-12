import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-airbnb-light-gray to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-main rounded-md flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">OTB</span>
              </div>
              <h1 className="text-xl font-semibold text-airbnb-charcoal">
                Channel Manager
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/auth/signin">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-airbnb-charcoal hover:bg-gray-50"
                >
                  Se connecter
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  className="bg-main hover:bg-main-dark text-white"
                  size="sm"
                >
                  Commencer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Announcement Banner */}
        <div className="py-6 text-center">
          <Badge
            variant="secondary"
            className="bg-gray-100 text-airbnb-charcoal px-4 py-2 rounded-full"
          >
            <span className="text-sm">
              ✨ Nouveau ! Connectez votre calendrier avec Google Calendar
            </span>
          </Badge>
        </div>

        {/* Hero Section */}
        <div className="text-center py-16">
          <h2 className="text-5xl md:text-6xl font-bold text-airbnb-charcoal mb-8 leading-tight">
            Un système de réservation qui
            <br />
            fonctionne comme un <span className="text-main">Organiseur</span>
          </h2>

          <p className="text-xl text-airbnb-dark-gray mb-12 max-w-3xl mx-auto leading-relaxed">
            Créez des événements élégants et un système qui s&apos;adapte à vos
            besoins, en facilitant la vente de billets et la simplification des
            paiements pour vos invités.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-main hover:bg-main-dark text-white px-8 py-4 text-lg font-medium rounded-lg"
              >
                ✨ Commencer gratuitement
              </Button>
            </Link>
            <Link
              href="/demo"
              className="text-airbnb-dark-gray hover:text-airbnb-charcoal text-lg underline"
            >
              Voir une démo
            </Link>
          </div>
        </div>

        {/* Trust Section */}
        <div className="py-12 border-t border-gray-200">
          <div className="text-center mb-8">
            <p className="text-sm text-airbnb-dark-gray uppercase tracking-wide">
              Ils nous font confiance
            </p>
          </div>
          <div className="flex justify-center items-center space-x-12 opacity-60">
            {/* Logo placeholders */}
            <div className="text-2xl font-bold text-gray-400">HILTON</div>
            <div className="text-2xl font-bold text-gray-400">ACCOR</div>
            <div className="text-2xl font-bold text-gray-400">MARRIOTT</div>
            <div className="text-2xl font-bold text-gray-400">IBIS</div>
            <div className="text-2xl font-bold text-gray-400">NOVOTEL</div>
          </div>
        </div>

        {/* Feature Section */}
        <div className="py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Features */}
            <div>
              <div className="mb-8">
                <Badge
                  variant="secondary"
                  className="bg-blue-50 text-blue-600 mb-4"
                >
                  Configuration rapide et facile
                </Badge>
                <h3 className="text-3xl font-bold text-airbnb-charcoal mb-4">
                  Configuration rapide et facile
                </h3>
                <p className="text-lg text-airbnb-dark-gray leading-relaxed">
                  &quot;Nous avons vendu des milliers de billets en tant que
                  petite équipe de trois personnes. C&apos;est le seul outil
                  dont nous avons besoin.&quot;
                </p>
                <div className="mt-6 flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  <div>
                    <p className="font-medium text-airbnb-charcoal">
                      Sarah Martin
                    </p>
                    <p className="text-sm text-airbnb-dark-gray">
                      Responsable Événements
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-airbnb-charcoal mb-1">
                      Personnalisation complète
                    </h4>
                    <p className="text-airbnb-dark-gray">
                      Adaptez l&apos;interface à votre marque et vos besoins
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-airbnb-charcoal mb-1">
                      Intégrations multiples
                    </h4>
                    <p className="text-airbnb-dark-gray">
                      Connectez Google Calendar, Airbnb, Booking.com et plus
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-airbnb-charcoal mb-1">
                      Support en temps réel
                    </h4>
                    <p className="text-airbnb-dark-gray">
                      Assistance technique disponible 24h/7j
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Mock Interface */}
            <div className="relative">
              <div className="airbnb-card p-6 max-w-md mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-semibold text-airbnb-charcoal">
                    Gérer vos espaces
                  </h4>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg mr-3 flex items-center justify-center">
                        <span className="text-blue-600 text-sm">🏨</span>
                      </div>
                      <div>
                        <p className="font-medium text-airbnb-charcoal text-sm">
                          Suite Deluxe
                        </p>
                        <p className="text-xs text-airbnb-dark-gray">
                          Disponible
                        </p>
                      </div>
                    </div>
                    <span className="text-main font-semibold">150€</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-lg mr-3 flex items-center justify-center">
                        <span className="text-green-600 text-sm">🏛️</span>
                      </div>
                      <div>
                        <p className="font-medium text-airbnb-charcoal text-sm">
                          Salle de conférence
                        </p>
                        <p className="text-xs text-airbnb-dark-gray">
                          Réservée
                        </p>
                      </div>
                    </div>
                    <span className="text-main font-semibold">80€</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg mr-3 flex items-center justify-center">
                        <span className="text-purple-600 text-sm">🏢</span>
                      </div>
                      <div>
                        <p className="font-medium text-airbnb-charcoal text-sm">
                          Bureau privé
                        </p>
                        <p className="text-xs text-airbnb-dark-gray">
                          Disponible
                        </p>
                      </div>
                    </div>
                    <span className="text-main font-semibold">120€</span>
                  </div>
                </div>

                <Button className="w-full mt-6 bg-main hover:bg-main-dark text-white">
                  Ajouter un espace
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 text-center">
          <h3 className="text-3xl font-bold text-airbnb-charcoal mb-6">
            Prêt à transformer votre gestion ?
          </h3>
          <p className="text-xl text-airbnb-dark-gray mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d&apos;établissements qui optimisent leurs
            réservations avec notre plateforme.
          </p>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="bg-main hover:bg-main-dark text-white px-8 py-4 text-lg font-medium"
            >
              Commencer maintenant
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-main rounded-md flex items-center justify-center mr-2">
                <span className="text-white font-bold text-xs">OTB</span>
              </div>
              <span className="text-lg font-semibold text-airbnb-charcoal">
                Channel Manager
              </span>
            </div>
            <p className="text-airbnb-dark-gray">
              © 2025 OTB Channel Manager. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
