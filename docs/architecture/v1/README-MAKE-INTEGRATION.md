# CMS Campagnes Média - Intégration Make.com

## Résumé des Changements Architecture

### ✅ Changements Clés

1. **Publication via Make.com** au lieu d'applications directes
   - Pas de création d'apps pour chaque réseau social
   - Utilisation de Make.com comme gateway de publication
   - Création automatique de scénarios via Make API

2. **Stockage SharePoint** au lieu de S3
   - Microsoft Graph API pour upload/download
   - Intégration native Microsoft 365
   - Gestion de permissions granulaire

3. **Meilisearch** au lieu d'Elasticsearch
   - Plus léger et plus rapide
   - PostgreSQL Full-Text Search en complément
   - Simple à déployer (Docker)

## Flux d'Intégration Make.com

### Configuration Initiale (Une seule fois)

1. **Agent configure Make.com**
   - Crée un compte Make.com Team
   - Configure les connexions OAuth aux réseaux sociaux
   - Obtient l'API Token Make

2. **Agent enregistre dans le CMS**
   - Platform: Facebook, Instagram, YouTube, etc.
   - Make Connection ID
   - Account Identifier (Page ID, Channel ID, etc.)

### Création de Campagne

1. **User crée campagne dans CMS**
2. **CMS → Make API** : Create Scenario
3. **Make API** → Return Scenario ID & Webhook URL
4. **CMS stocke** : `campaign_scenarios` table

### Publication

1. **User approuve objet**
2. **CMS prépare payload JSON**
3. **CMS → Webhook Make** (POST)
4. **Make exécute scénario** :
   - Upload média si nécessaire
   - Publie sur réseau social
   - Récupère external_id
5. **Make → CMS Webhook** (callback status)
6. **CMS stocke résultat**

## Stack Technologique Final

- **Backend**: Symfony 7.x (PHP 8.2+)
- **Database**: PostgreSQL 15+ (avec Full-Text Search)
- **Cache**: Redis 7+
- **Queue**: RabbitMQ
- **Search**: Meilisearch (+ PostgreSQL FTS)
- **Storage**: SharePoint via Microsoft Graph API
- **Publication Gateway**: Make.com (API)
- **Content Generation**: N8N (optionnel)

## Avantages de cette Approche

### Make.com

✅ **Pas de gestion OAuth complexe** - Make.com gère les tokens
✅ **Intégrations prêtes** - 1500+ apps disponibles
✅ **Pas de maintenance** - Make gère les changements d'API
✅ **Visual workflows** - Facile à déboguer
✅ **Retry automatique** - Gestion d'erreurs intégrée

### SharePoint

✅ **Intégration M365** - Déjà utilisé dans l'entreprise
✅ **Permissions granulaires** - ACL par fichier
✅ **Versioning automatique** - Historique des médias
✅ **Prévisualisation native** - Pas besoin de service tiers
✅ **Pas de coûts S3** - Inclus dans licence M365

### Meilisearch

✅ **Ultra rapide** - Recherche en < 50ms
✅ **Facile à déployer** - Un seul container Docker
✅ **Typo-tolerant** - Recherche intelligente
✅ **Faceted search** - Filtres par tags, type, date
✅ **Léger** - Beaucoup moins de ressources qu'Elasticsearch

## API Make.com - Endpoints Clés

### Create Scenario
```bash
POST https://eu1.make.com/api/v2/scenarios
Authorization: Token YOUR_API_TOKEN
Content-Type: application/json

{
  "name": "Campaign #{id} - Facebook",
  "teamId": 123456,
  "blueprint": {...},
  "scheduling": {"type": "immediately"}
}
```

### Clone Scenario from Template
```bash
POST https://eu1.make.com/api/v2/scenarios/{template_id}/clone
{
  "name": "Campaign #789 - Instagram",
  "teamId": 123456
}
```

### Trigger Scenario via Webhook
```bash
POST https://hook.eu1.make.com/{webhook_id}
Content-Type: application/json

{
  "campaign_id": 123,
  "object_id": 456,
  "content": {
    "message": "Mon post",
    "media_url": "https://sharepoint.com/..."
  }
}
```

## Microsoft Graph API - SharePoint

### Upload File
```bash
PUT https://graph.microsoft.com/v1.0/sites/{site-id}/drive/root:/media/{filename}:/content
Authorization: Bearer {access_token}
Content-Type: image/jpeg

[binary data]
```

### Create Sharing Link
```bash
POST https://graph.microsoft.com/v1.0/sites/{site-id}/drive/items/{file-id}/createLink
{
  "type": "view",
  "scope": "anonymous"
}
```

## Meilisearch

### Index Media
```bash
POST http://localhost:7700/indexes/media_assets/documents
X-Meili-API-Key: YOUR_API_KEY

[{
  "id": 123,
  "filename": "product.jpg",
  "tags": ["tech", "innovation"],
  "type": "image"
}]
```

### Search
```bash
GET http://localhost:7700/indexes/media_assets/search?q=tech&filter=type=image
```

## Prochaines Étapes

1. ✅ Valider l'architecture Make.com
2. ⏳ Créer compte Make.com Team
3. ⏳ Configurer connexions sociales dans Make
4. ⏳ Développer Make API Service (Symfony)
5. ⏳ Créer templates de scénarios Make
6. ⏳ Configurer SharePoint site
7. ⏳ Implémenter Graph API service
8. ⏳ Installer Meilisearch
9. ⏳ POC: Campagne → Make → Facebook
