"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReservationModal } from "@/components/reservations/ReservationModal";
import { Calendar, Clock, User, CheckCircle } from "lucide-react";

// Mock data for demo
const mockRooms = [
  {
    id: "room-1",
    name: "Salle de Réunion A",
    propertyName: "Centre d'Affaires",
    pricePerNight: 150,
  },
  {
    id: "room-2",
    name: "Bureau Privé",
    propertyName: "Centre d'Affaires",
    pricePerNight: 80,
  },
  {
    id: "room-3",
    name: "Espace Coworking",
    propertyName: "Centre d'Affaires",
    pricePerNight: 25,
  },
];

export default function DemoPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-main rounded-md flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">OTB</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Channel Manager - Démo
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Retour
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Interface de Réservation Moderne
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Découvrez notre nouvelle interface de réservation inspirée de
            Calendly. Simple, intuitive et élégante pour une expérience
            utilisateur exceptionnelle.
          </p>
          <Button
            size="lg"
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-medium rounded-lg"
          >
            🚀 Essayer l'Interface
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sélection de Date
            </h3>
            <p className="text-gray-600">
              Calendrier mensuel intuitif avec navigation facile
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Créneaux Horaires
            </h3>
            <p className="text-gray-600">
              Sélection d'horaires avec choix de durée flexible
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Détails Client
            </h3>
            <p className="text-gray-600">
              Formulaire simple pour les informations du client
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmation
            </h3>
            <p className="text-gray-600">
              Récapitulatif complet avant confirmation
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Prêt à tester ?
          </h3>
          <p className="text-gray-600 mb-6">
            Cliquez sur le bouton ci-dessous pour découvrir l'interface en
            action
          </p>
          <Button
            size="lg"
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-medium rounded-lg"
          >
            🎯 Commencer la Démo
          </Button>
        </div>
      </main>

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => {
          setIsModalOpen(false);
        }}
        rooms={mockRooms}
        currency="EUR"
      />
    </div>
  );
}
