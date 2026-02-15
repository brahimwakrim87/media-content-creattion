# Architecture Finale - Résumé Exécutif

## 🎯 Configuration Initiale (par l'Agent)

### Flux de Création de Compte Social

```
AGENT → CMS : "Add Social Account"

┌────────────────────────────────────────────────────┐
│ 1. Agent renseigne :                               │
│    - Platform: Facebook                            │
│    - Account Name: "Page Entreprise"               │
│    - Account Type: page                            │
├────────────────────────────────────────────────────┤
│ 2. CMS → Make API : Create OAuth URL               │
│    Make API → CMS : auth_url                       │
├────────────────────────────────────────────────────┤
│ 3. CMS → Agent : "Cliquez pour authentifier"       │
│    Agent → Click                                   │
│    Browser → Facebook OAuth                        │
├────────────────────────────────────────────────────┤
│ 4. Facebook → User (Owner) : "Authorize App?"      │
│    User → YES (Authorize)                          │
│    Facebook → Make : authorization_code            │
├────────────────────────────────────────────────────┤
│ 5. Make → Create Connection (conn_fb_001)          │
│    Make → Auto-Create Basic Scenario :             │
│      Module 1: Webhook                             │
│      Module 2: Get Media from Payload              │
│      Module 3: Facebook Create Post                │
│      Module 4: HTTP Callback CMS                   │
├────────────────────────────────────────────────────┤
│ 6. Make → CMS Webhook :                            │
│    {                                               │
│      connection_id: conn_fb_001,                   │
│      scenario_id: scen_123,                        │
│      webhook_url: "https://hook.make.com/xyz"      │
│    }                                               │
├────────────────────────────────────────────────────┤
│ 7. CMS → Store in social_accounts :                │
│    - platform: facebook                            │
│    - account_name: "Page Entreprise"               │
│    - make_connection_id: conn_fb_001               │
│    - make_scenario_id: scen_123                    │
│    - webhook_url: https://hook.make.com/xyz        │
│    - status: active                                │
└────────────────────────────────────────────────────┘

✅ Compte configuré et prêt à être utilisé dans les campagnes
```

## 🎬 Scénario Make Basique (Auto-créé)

### Structure Minimale

```json
{
  "modules": [
    {
      "1": "Webhook Trigger",
      "input": {
        "object_id": 789,
        "campaign_id": 123,
        "content": {
          "message": "Texte du post",
          "media_url": "https://sharepoint.com/.../image.jpg",
          "hashtags": ["tech", "innovation"]
        },
        "platform_config": {
          "page_id": "123456789"
        }
      }
    },
    {
      "2": "Facebook Create Post",
      "connection": "{{MAKE_CONNECTION_ID}}",
      "page_id": "{{1.platform_config.page_id}}",
      "message": "{{1.content.message}}",
      "picture": "{{1.content.media_url}}"
    },
    {
      "3": "HTTP Callback",
      "url": "https://cms.example.com/api/webhooks/status",
      "body": {
        "object_id": "{{1.object_id}}",
        "status": "success",
        "external_id": "{{2.id}}",
        "platform": "facebook"
      }
    }
  ]
}
```

## 📊 Schéma Base de Données Simplifié

```sql
-- Comptes sociaux globaux (configurés par l'agent)
CREATE TABLE social_accounts (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50), -- facebook, instagram, youtube
    account_name VARCHAR(255), -- "Page Facebook Entreprise"
    account_identifier VARCHAR(255), -- page_id, channel_id
    make_connection_id BIGINT, -- Connexion Make.com
    make_scenario_id BIGINT, -- Scénario Make.com
    webhook_url TEXT, -- URL du webhook
    status VARCHAR(50), -- active, expired, revoked
    created_by INT, -- Agent user_id
    created_at TIMESTAMP
);

-- Association campagnes ↔ comptes sociaux
CREATE TABLE campaign_targets (
    id SERIAL PRIMARY KEY,
    campaign_id INT REFERENCES campaigns(id),
    social_account_id INT REFERENCES social_accounts(id),
    is_active BOOLEAN DEFAULT true,

    UNIQUE(campaign_id, social_account_id)
);

-- Publications
CREATE TABLE publications (
    id SERIAL PRIMARY KEY,
    object_id INT REFERENCES campaign_objects(id),
    social_account_id INT REFERENCES social_accounts(id),
    external_id VARCHAR(255), -- post_id from Facebook/Instagram
    status VARCHAR(50), -- pending, published, failed
    published_at TIMESTAMP,
    error_message TEXT
);
```

## 🚀 Flux de Publication

```
User → CMS : Approve Object

CMS → Prepare Payload :
  {
    object_id: 789,
    campaign_id: 123,
    content: {
      message: "Post text",
      media_url: "https://sharepoint.com/video.mp4",
      hashtags: ["tech"]
    },
    platform_config: {
      page_id: "123456789"
    }
  }

CMS → POST webhook_url (from social_accounts)

Make Scenario :
  1. Receive webhook
  2. Get media from payload.content.media_url
  3. Publish to Facebook (use connection)
  4. Callback CMS with result

Make → CMS :
  {
    object_id: 789,
    status: "success",
    external_id: "fb_post_123"
  }

CMS → Update publications table
CMS → Notify User : "Published ✓"
```

## ✨ Avantages de cette Architecture

### Configuration par l'Agent
✅ **Centralisation** - L'agent configure une fois, tous utilisent
✅ **Sécurité** - Pas de tokens OAuth dans le CMS
✅ **Réutilisation** - Mêmes comptes pour toutes les campagnes

### Scénarios Make Basiques
✅ **Simplicité** - 3 modules seulement (Webhook → Publish → Callback)
✅ **Maintenance** - Pas de logique complexe
✅ **Fiabilité** - Moins de points de défaillance

### Séparation N8N / Make
✅ **N8N** - Content generation (vidéo, image, texte, analytics)
✅ **Make** - Publication UNIQUEMENT
✅ **Clarté** - Chaque outil a un rôle précis
