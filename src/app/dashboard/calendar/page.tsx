import { Calendar } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-airbnb-charcoal">Planning</h1>
          <p className="text-airbnb-dark-gray mt-2">
            Gérez les disponibilités et réservations
          </p>
        </div>
      </div>

      <div className="text-center py-16">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-airbnb-charcoal mb-2">
          Calendrier en développement
        </h3>
        <p className="text-airbnb-dark-gray">
          Le module de planning sera disponible bientôt
        </p>
      </div>
    </div>
  );
}
