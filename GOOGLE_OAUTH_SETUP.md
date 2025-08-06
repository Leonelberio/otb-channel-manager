# Configuration Google OAuth pour l'intégration Google Calendar

## Étapes de configuration

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google Calendar

### 2. Configurer les identifiants OAuth

1. Dans la console Google Cloud, allez dans "APIs & Services" > "Credentials"
2. Cliquez sur "Create Credentials" > "OAuth 2.0 Client IDs"
3. Sélectionnez "Web application"
4. Ajoutez les URIs de redirection autorisés :
   - `http://localhost:3000/api/integrations/google-calendar/callback` (développement)
   - `https://votre-domaine.com/api/integrations/google-calendar/callback` (production)

### 3. Variables d'environnement

Ajoutez ces variables à votre fichier `.env` :

```env
# Google OAuth
GOOGLE_CLIENT_ID="votre-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="votre-client-secret"
```

### 4. Scopes requis

L'application demande les scopes suivants :
- `https://www.googleapis.com/auth/calendar.readonly` - Lecture des calendriers
- `https://www.googleapis.com/auth/calendar.events` - Gestion des événements

### 5. Test de l'intégration

1. Démarrez l'application : `pnpm dev`
2. Allez sur `/dashboard/calendar`
3. Cliquez sur l'onglet "Intégrations"
4. Cliquez sur "Connecter" pour Google Calendar
5. Suivez le flux d'authentification Google

## Dépannage

### Erreur "Configuration Google OAuth manquante"
- Vérifiez que `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont définis dans `.env`

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URI de redirection dans Google Cloud Console correspond exactement à votre configuration

### Erreur "invalid_client"
- Vérifiez que le Client ID et Client Secret sont corrects
- Assurez-vous que l'API Google Calendar est activée 