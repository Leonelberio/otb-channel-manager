# 🏨 OTB Channel Manager

Un gestionnaire de canal moderne et élégant pour les hôtels et espaces d'hébergement, inspiré par le design Airbnb.

## ✨ Fonctionnalités

### 🔐 Authentification & Organisations
- Système d'inscription et connexion sécurisé
- Gestion multi-organisation avec rôles (admin, manager, viewer)
- Onboarding personnalisé selon le type d'établissement

### 🏠 Gestion des Propriétés
- **Hôtels** : Gestion des chambres, suites et espaces d'hébergement
- **Espaces** : Coworking, coliving, centres de séminaire, résidences
- Configuration des équipements et services
- Règles de check-in/check-out personnalisables

### 📅 Planning & Disponibilités
- Calendrier interactif pour la gestion des disponibilités
- Statuts : Disponible, Indisponible, Réservé, Maintenance
- Synchronisation Google Calendar (à venir)

### 📬 Réservations
- Interface de gestion des réservations
- Suivi des statuts : En attente, Confirmé, Annulé, Terminé
- Notifications et rappels automatiques

## 🛠 Stack Technique

- **Frontend** : Next.js 15 (App Router), React 19, TypeScript
- **Backend** : Next.js API Routes
- **Base de données** : PostgreSQL avec Prisma ORM
- **Authentification** : NextAuth.js
- **UI/UX** : Tailwind CSS avec design system Airbnb
- **State Management** : TanStack Query
- **Déploiement** : Vercel + Neon DB

## 🚀 Installation

### Prérequis
- Node.js 18+
- pnpm
- PostgreSQL (ou Neon DB)

### Configuration

1. **Cloner le projet**
```bash
git clone <repository-url>
cd channelmanager
```

2. **Installer les dépendances**
```bash
pnpm install
```

3. **Configuration de l'environnement**
```bash
cp .env.example .env
```

Configurer les variables dans `.env` :
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google Calendar API (optionnel)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

4. **Base de données**
```bash
# Générer le client Prisma
pnpm dlx prisma generate

# Pousser le schéma vers la DB
pnpm dlx prisma db push
```

5. **Démarrer le serveur**
```bash
pnpm dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 📋 Flow d'onboarding

### Étape 1 : Informations de base
- Nom de l'organisation
- Langue préférée

### Étape 2 : Type d'établissement
- **Hôtel** → Terminologie "chambres"
- **Espace** → Terminologie "espaces"

### Étape 3 : Première propriété
- Nom et adresse
- Type de propriété

### Étape 4 : Première unité
- Nom de la chambre/espace
- Capacité et tarification
- Équipements de base

## 🗃 Structure de la base de données

### Entités principales
- **User** : Utilisateurs avec authentification
- **Organisation** : Organisations multi-utilisateurs
- **Property** : Propriétés (hôtels, résidences, etc.)
- **Room** : Unités (chambres, espaces)
- **Equipment** : Équipements des unités
- **Availability** : Disponibilités par date
- **Reservation** : Réservations des clients

### Relations
- Un utilisateur peut appartenir à plusieurs organisations
- Une organisation peut avoir plusieurs propriétés
- Une propriété peut avoir plusieurs unités
- Chaque unité a ses équipements et disponibilités

## 🎨 Design System

### Palette de couleurs
- **Rouge Airbnb** : `#FF5A5F` (principal)
- **Rouge foncé** : `#E14D52` (hover)
- **Gris clair** : `#F7F7F7` (background)
- **Gris moyen** : `#EBEBEB` (borders)
- **Gris foncé** : `#767676` (text)
- **Charcoal** : `#484848` (headings)

### Composants
- Boutons avec variant `airbnb`
- Cards avec style `airbnb-card`
- Inputs avec style `airbnb-input`
- Navigation sidebar responsive

## 🗺 Roadmap

### Version 1.0 (MVP)
- [x] Authentification et organisations
- [x] Onboarding flow
- [x] Gestion basique des propriétés
- [x] Dashboard principal
- [ ] Planning/calendrier
- [ ] Gestion des réservations

### Version 1.1
- [ ] Synchronisation Google Calendar
- [ ] Notifications email
- [ ] Rapports et analytics
- [ ] Multi-langue complet

### Version 2.0
- [ ] API publique pour réservations
- [ ] Widget de réservation embeddable
- [ ] Intégration Airbnb/Booking.com
- [ ] App mobile

## 🧪 Tests

```bash
# Tests unitaires
pnpm test

# Tests E2E
pnpm test:e2e

# Tests de type
pnpm type-check
```

## 📦 Déploiement

### Vercel (Recommandé)
1. Connecter le repository GitHub
2. Configurer les variables d'environnement
3. Deploy automatique

### Autres plateformes
- Docker support à venir
- Railway, Render compatibles

## 🤝 Contribution

1. Fork le project
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changes (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- Design inspiré par [Airbnb](https://airbnb.com)
- Components UI par [Shadcn/ui](https://ui.shadcn.com)
- Icons par [Lucide](https://lucide.dev)

---

**Développé avec ❤️ pour moderniser la gestion hôtelière**
