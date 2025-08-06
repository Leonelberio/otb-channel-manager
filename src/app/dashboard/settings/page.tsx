import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-airbnb-charcoal">
            Paramètres
          </h1>
          <p className="text-airbnb-dark-gray mt-2">
            Configurez votre compte et vos préférences
          </p>
        </div>
      </div>

      <div className="text-center py-16">
        <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-airbnb-charcoal mb-2">
          Paramètres en développement
        </h3>
        <p className="text-airbnb-dark-gray">
          La page de paramètres sera disponible bientôt
        </p>
      </div>
    </div>
  );
}
