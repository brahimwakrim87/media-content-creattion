# Architecture Finale - CMS Campagnes Média

## 🎯 Vue d'Ensemble

**Objectif** : CMS de gestion de campagnes média multi-canal avec publication automatisée et connexions sociales dynamiques par campagne.

---

## 🏗️ Stack Technologique

### Backend & Database
- **Framework** : Symfony 7.x (PHP 8.2+)
- **Base de Données** : PostgreSQL 15+ (avec Full-Text Search)
- **Cache** : Redis 7+ Cluster
- **Queue** : RabbitMQ 3.12+
- **API** : Symfony API Platform

### Automation & Publication
- **Content Generation** : **N8N** (self-hosted)
  - Génération vidéo, image, texte
  - Analytics collection
  - Sourcing automatique

- **Publication** : **Make.com** (SaaS)
  - Publication multi-plateforme UNIQUEMENT
  - Connexions OAuth dynamiques par campagne
  - Retry automatique

### Storage & Search
- **Media Storage** : **SharePoint** (via Microsoft Graph API)
  - Document Library
  - Versioning automatique
  - Permissions granulaires

- **Search Engine** : **Meilisearch** + PostgreSQL FTS
  - Recherche ultra-rapide (< 50ms)
  - Typo-tolerant
  - Faceted search

---

## 🔄 Séparation des Responsabilités

### N8N (Content Generation & Analytics)

**Responsabilités** :
- 🎬 **Génération de vidéos**
  - Assemblage de clips
  - Montage automatique (transitions, effets)
  - Sous-titres automatiques (Whisper AI)
  - Génération de thumbnails

- 🖼️ **Traitement d'images**
  - Redimensionnement multi-plateforme
  - Watermarking
  - Optimisation (compression)
  - Création de variantes

- 📝 **Génération de texte**
  - Posts optimisés par plateforme (GPT/Claude)
  - Génération de hashtags
  - Articles SEO-friendly

- 🎵 **Traitement audio**
  - Transcription (audio → texte)
  - Text-to-speech
  - Nettoyage audio

- 📊 **Analytics Collection**
  - Collecte horaire des métriques
  - Agrégation multi-plateformes
  - Stockage dans CMS

- 📥 **Sourcing Automatique**
  - APIs externes (Unsplash, Pexels)
  - Web scraping
  - Import RSS feeds

**Workflows N8N** :
```
CMS → N8N Webhook → Processing → SharePoint Upload → CMS Callback
```

---

### Make.com (Publication ONLY)

**Responsabilités** :
- 📤 **Publication multi-plateforme**
  - Facebook, Instagram, Twitter/X
  - YouTube, TikTok, LinkedIn
  - WordPress, sites custom

**Connexions Dynamiques** :
- ✅ Une connexion OAuth par campagne et par plateforme
- ✅ User connecte ses propres comptes pour chaque campagne
- ✅ Révocation possible sans affecter autres campagnes

**Scénarios Make** :
```
CMS → Make Webhook → Use Dynamic Connection → Publish → Callback CMS
```

---

## 📋 Flux Complet

### 0️⃣ Configuration Initiale par l'Agent (Une seule fois)

```
┌──────────────────────────────────────────────────────────┐
│ AGENT → CMS : Add Social Account                         │
├──────────────────────────────────────────────────────────┤
│ Agent renseigne :                                        │
│   - Platform : Facebook                                  │
│   - Account Name : "Page Entreprise Principal"           │
│   - Account Type : page / profile / business             │
│                                                          │
│ CMS → Make API : Create OAuth URL                        │
│ Make API → CMS : auth_url                                │
│                                                          │
│ CMS → Agent : "Cliquez pour authentifier"                │
│ Agent → Click → Redirect to Facebook OAuth               │
│                                                          │
│ Facebook OAuth → User (Owner) : "Authorize?"             │
│ User → Authorize                                         │
│ Facebook → Make : Authorization Code                     │
│ Make → Create Connection (conn_global_fb_001)            │
│                                                          │
│ Make → Automatically Create Basic Scenario :             │
│   ┌────────────────────────────────────────┐             │
│   │ Module 1: Webhook Trigger              │             │
│   │ Module 2: Get Media from Payload       │             │
│   │ Module 3: Facebook - Create Post       │             │
│   │   - Use connection conn_global_fb_001  │             │
│   │   - Dynamic page_id from payload       │             │
│   │ Module 4: HTTP Callback to CMS         │             │
│   └────────────────────────────────────────┘             │
│                                                          │
│ Make API → CMS Webhook : {                               │
│   connection_id: conn_global_fb_001,                     │
│   scenario_id: scen_123,                                 │
│   webhook_url: "https://hook.make.com/xyz"               │
│ }                                                        │
│                                                          │
│ CMS → Store in social_accounts table :                   │
│   - platform: facebook                                   │
│   - account_name: "Page Entreprise Principal"            │
│   - make_connection_id: conn_global_fb_001               │
│   - make_scenario_id: scen_123                           │
│   - webhook_url: https://hook.make.com/xyz               │
│   - status: active                                       │
│                                                          │
│ (Agent répète pour Instagram, YouTube, etc.)             │
└──────────────────────────────────────────────────────────┘
```

### 1️⃣ Création de Campagne (par User)

```
┌─────────────────────────────────────────────┐
│ User → CMS : Create Campaign                │
├─────────────────────────────────────────────┤
│ User renseigne :                            │
│   - Name : "Lancement Produit X"            │
│   - Topics & Tags                           │
│   - Budget & Timeline                       │
│                                             │
│ CMS : "Sélectionnez les comptes sociaux"    │
│ CMS → Display list from social_accounts :   │
│   ☑ Facebook - Page Entreprise Principal   │
│   ☑ Instagram - @brand_official             │
│   ☑ YouTube - Brand Channel                │
│                                             │
│ User → Select accounts                      │
│ CMS → Store in campaign_targets :           │
│   campaign_id → social_account_id           │
│                                             │
│ Campagne créée ✓                            │
│ (Scénarios Make déjà existants, réutilisés) │
└─────────────────────────────────────────────┘
```

### 2️⃣ Génération de Contenu (N8N)

```
┌─────────────────────────────────────────────┐
│ User → CMS : Create Video Object            │
├─────────────────────────────────────────────┤
│ CMS → N8N Webhook : Generate Video          │
│                                             │
│ N8N Workflow:                               │
│   1. Download source clips                  │
│   2. Assemble (ffmpeg)                      │
│   3. Add subtitles (Whisper AI)            │
│   4. Generate thumbnail (ImageMagick)       │
│   5. Upload to SharePoint                   │
│   6. Create sharing link                    │
│                                             │
│ SharePoint → N8N : public_url               │
│ N8N → CMS Webhook : Content Ready           │
│ CMS → Update object : media_url, status     │
└─────────────────────────────────────────────┘
```

### 3️⃣ Publication (Make.com)

```
┌─────────────────────────────────────────────┐
│ User → CMS : Approve & Publish              │
├─────────────────────────────────────────────┤
│ CMS → Prepare Payload:                      │
│   {                                         │
│     object_id: 789,                         │
│     content: {                              │
│       message: "Check this out!",           │
│       media_url: "https://sharepoint...",   │
│       hashtags: ["tech", "innovation"]      │
│     },                                      │
│     platform_config: {                      │
│       page_id: "123456789"                  │
│     }                                       │
│   }                                         │
│                                             │
│ CMS → Make Webhook (Facebook scenario)      │
│ Make Scenario:                              │
│   1. Receive webhook                        │
│   2. Use conn_123_fb (dynamic connection)   │
│   3. Facebook API : Create Post             │
│   4. Get post_id                            │
│   5. HTTP Callback to CMS                   │
│                                             │
│ Make → CMS : {status: "success",            │
│               external_id: "fb_123"}        │
│ CMS → Update publications table             │
│ CMS → User : Notification "Published ✓"     │
└─────────────────────────────────────────────┘
```

### 4️⃣ Analytics Collection (N8N)

```
┌─────────────────────────────────────────────┐
│ N8N Cron Job (Every hour)                   │
├─────────────────────────────────────────────┤
│ For each published object:                  │
│   N8N → Facebook API : Get insights         │
│   Facebook → N8N : {impressions, clicks}    │
│                                             │
│   N8N → Instagram API : Get insights        │
│   Instagram → N8N : {reach, engagement}     │
│                                             │
│   N8N → YouTube API : Get analytics         │
│   YouTube → N8N : {views, watch_time}       │
│                                             │
│   N8N → CMS API : POST /analytics           │
│   CMS → Store in analytics_metrics table    │
│   CMS → Update Dashboard                    │
└─────────────────────────────────────────────┘
```

---

## 🗄️ Schéma Base de Données

### Tables Clés

#### `campaigns`
```sql
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INT NOT NULL,
    status VARCHAR(50), -- draft, active, paused, completed
    goals JSONB,
    budget DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `social_accounts` (Comptes sociaux globaux configurés par l'agent)
```sql
CREATE TABLE social_accounts (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL, -- facebook, instagram, youtube, etc.
    account_name VARCHAR(255) NOT NULL, -- "Page Facebook Entreprise"
    account_type VARCHAR(50), -- page, profile, business, channel
    account_identifier VARCHAR(255), -- page_id, channel_id, user_id

    -- Make.com Integration
    make_connection_id BIGINT NOT NULL, -- ID connexion dans Make.com
    make_scenario_id BIGINT NOT NULL, -- ID scénario dans Make.com
    webhook_url TEXT NOT NULL, -- Webhook URL du scénario

    -- Status & Metadata
    status VARCHAR(50) DEFAULT 'active', -- active, expired, revoked, error
    created_by INT, -- Agent user_id
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    metadata JSONB, -- permissions, scopes, page info, etc.

    UNIQUE(platform, account_identifier)
);
```

#### `campaign_targets` (Association campagnes ↔ comptes sociaux)
```sql
CREATE TABLE campaign_targets (
    id SERIAL PRIMARY KEY,
    campaign_id INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    social_account_id INT NOT NULL REFERENCES social_accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(campaign_id, social_account_id)
);
```

#### `campaign_objects`
```sql
CREATE TABLE campaign_objects (
    id SERIAL PRIMARY KEY,
    campaign_id INT NOT NULL REFERENCES campaigns(id),
    type VARCHAR(50), -- video, post, article, image, advertisement
    content TEXT,
    media_url TEXT, -- SharePoint sharing link
    status VARCHAR(50), -- draft, generating, ready, approved, published
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `publications`
```sql
CREATE TABLE publications (
    id SERIAL PRIMARY KEY,
    object_id INT NOT NULL REFERENCES campaign_objects(id),
    scenario_id INT REFERENCES campaign_scenarios(id),
    platform VARCHAR(50),
    external_id VARCHAR(255), -- post_id from social network
    status VARCHAR(50), -- pending, published, failed
    published_at TIMESTAMP,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### `analytics_metrics`
```sql
CREATE TABLE analytics_metrics (
    id SERIAL PRIMARY KEY,
    publication_id INT NOT NULL REFERENCES publications(id),
    metric_type VARCHAR(50), -- impressions, clicks, engagement, etc.
    value DECIMAL(15,2),
    measured_at TIMESTAMP NOT NULL,
    metadata JSONB, -- platform-specific metrics
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Sécurité

### OAuth Tokens
- ❌ **Jamais stockés dans le CMS**
- ✅ **Gérés par Make.com**
- ✅ **Refresh automatique par Make**

### Permissions
- Granulaires par campagne
- Révocation sans impact sur autres campagnes
- Audit trail complet

### Data Protection
- Encryption at rest (PostgreSQL, Redis)
- TLS 1.3 obligatoire
- RGPD compliant

---

## 📊 Avantages de cette Architecture

### Make.com Connexions Dynamiques

✅ **Isolation par Campagne**
- Chaque campagne = ses propres connexions OAuth
- Pas de risque de cross-contamination

✅ **Flexibilité Utilisateur**
- User connecte ses propres comptes
- Pas besoin d'accès admin global

✅ **Révocation Simple**
- Déconnecter une campagne n'affecte pas les autres
- Gestion fine des permissions

✅ **Pas de Gestion OAuth**
- Make gère tokens, refresh, expiration
- Pas de code OAuth dans le CMS

### N8N Content Generation

✅ **Workflows Complexes**
- Assemblage vidéo multi-sources
- IA pour génération texte/image

✅ **Self-hosted**
- Données sensibles restent en interne
- Pas de limites d'exécution

✅ **Extensible**
- Nouveaux workflows facilement ajoutables

### SharePoint Storage

✅ **Intégration M365**
- Déjà utilisé dans l'entreprise
- SSO avec Azure AD

✅ **Versioning Automatique**
- Historique complet des médias

✅ **Permissions Granulaires**
- ACL par fichier/dossier

---

## 🚀 Prochaines Étapes

### Phase 1 : Setup Initial (1 semaine)
- [ ] Créer compte Make.com Team
- [ ] Obtenir Make API Token
- [ ] Configurer SharePoint Site
- [ ] Installer N8N (Docker)
- [ ] Installer Meilisearch (Docker)

### Phase 2 : POC (2 semaines)
- [ ] Développer Make API Service (Symfony)
- [ ] Créer template scénario Facebook
- [ ] Implémenter OAuth flow dynamique
- [ ] Tester : Campagne → Connexion → Publication

### Phase 3 : Content Generation (2 semaines)
- [ ] Créer N8N workflow : Video Generation
- [ ] Créer N8N workflow : Image Processing
- [ ] Intégrer SharePoint Graph API
- [ ] Tester : Object → N8N → SharePoint → CMS

### Phase 4 : Analytics (1 semaine)
- [ ] Créer N8N workflow : Facebook Insights
- [ ] Créer N8N workflow : Instagram Insights
- [ ] Dashboard analytics CMS
- [ ] Tester : Publication → Analytics Collection

---

## 📚 Documentation Technique

### Make API Endpoints

**Create Connection (OAuth)**
```bash
POST https://eu1.make.com/api/v2/connections
Authorization: Token YOUR_API_TOKEN

{
  "accountName": "Campaign #123 - Facebook",
  "accountType": "facebook-pages",
  "scopes": ["pages_manage_posts"]
}

Response: {
  "connection": {
    "id": 789012,
    "authUrl": "https://www.facebook.com/v18.0/dialog/oauth?..."
  }
}
```

**Create Scenario**
```bash
POST https://eu1.make.com/api/v2/scenarios

{
  "name": "Campaign #123 - FB Pub",
  "blueprint": {
    "flow": [
      {"module": "gateway:CustomWebHook"},
      {"module": "facebook:CreatePost",
       "parameters": {"connection": 789012}},
      {"module": "http:ActionSendData"}
    ]
  }
}

Response: {
  "scenario": {
    "id": 456,
    "webhookUrl": "https://hook.eu1.make.com/xyz"
  }
}
```

### Microsoft Graph API

**Upload to SharePoint**
```bash
PUT https://graph.microsoft.com/v1.0/sites/{site-id}/drive/root:/media/{filename}:/content
Authorization: Bearer {access_token}

[binary data]

Response: {
  "id": "file-id-123",
  "webUrl": "https://tenant.sharepoint.com/..."
}
```

**Create Sharing Link**
```bash
POST https://graph.microsoft.com/v1.0/sites/{site-id}/drive/items/{file-id}/createLink

{
  "type": "view",
  "scope": "anonymous"
}

Response: {
  "link": {
    "webUrl": "https://tenant.sharepoint.com/...sharing-link"
  }
}
```

### N8N Webhook Trigger

**Generate Video**
```bash
POST https://n8n.example.com/webhook/generate-video

{
  "object_id": 789,
  "sources": [
    "https://sharepoint.com/clip1.mp4",
    "https://sharepoint.com/clip2.mp4"
  ],
  "config": {
    "resolution": "1920x1080",
    "format": "mp4",
    "add_subtitles": true
  },
  "callback_url": "https://cms.example.com/api/webhooks/content-ready"
}
```

---

## 🎓 Formation Équipe

### Compétences Requises

**Backend Developer (Symfony)**
- API REST avec API Platform
- Integration Make.com API
- Integration Microsoft Graph API
- PostgreSQL + Redis

**DevOps**
- N8N deployment (Docker)
- Meilisearch setup
- RabbitMQ cluster
- PostgreSQL replication

**Frontend Developer**
- Dashboard analytics
- OAuth flow UI
- Campaign management UI

---

## 📈 Métriques de Succès

- **Time to Publish** : < 2 minutes (de création à publication)
- **Connexion OAuth** : < 30 secondes par plateforme
- **Content Generation** : < 5 minutes (vidéo HD)
- **Analytics Collection** : < 10 secondes par plateforme
- **Search Performance** : < 50ms (Meilisearch)

---

**Version** : 3.0
**Date** : 15 février 2026
**Auteur** : Architecture Team
