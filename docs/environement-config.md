# Environment Configuration

## Server

| Property | Value |
|----------|-------|
| **Provider** | Hetzner Cloud |
| **Server Name** | dmcc |
| **Server ID** | 121063875 |
| **Type** | CPX 22 (2 vCPU, 4 GB RAM, 80 GB disk) |
| **Location** | Nuremberg, DE (nbg1) |
| **OS** | Ubuntu 24.04.3 LTS |
| **IPv4** | 195.201.39.162 |
| **IPv6** | 2a01:4f8:c2c:6a46::/64 |
| **Cost** | ~5.99 EUR/month |
| **Domain** | mmc.ilinqsoft.com |

## DNS

| Record | Type | Value |
|--------|------|-------|
| mmc.ilinqsoft.com | A | 195.201.39.162 |
| mmc.ilinqsoft.com | AAAA | 2a01:4f8:c2c:6a46::1 |

## SSH Access

```bash
ssh -i ~/.ssh/dmcc_key root@195.201.39.162
```

- **Key Type:** ED25519
- **Key File:** `~/.ssh/dmcc_key`
- **Hetzner SSH Key ID:** 107474474

## Installed Software

| Software | Version |
|----------|---------|
| Docker | 29.2.1 |
| Docker Compose | v5.0.2 (plugin) |
| Docker Buildx | 0.31.1 |
| containerd | 2.2.1 |
| Git | pre-installed |
| Make | 4.3 |
| UFW | active |

## Firewall

### Hetzner Cloud Firewall

| ID | Name |
|----|------|
| 10537654 | dmcc-firewall |

### Rules (Hetzner + UFW)

| Port | Protocol | Description |
|------|----------|-------------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP |
| 443 | TCP | HTTPS |
| 5678 | TCP | n8n |
| — | ICMP | Ping |

- **Default incoming:** deny
- **Default outgoing:** allow

## Application Directory

```
/opt/dmcc
```

## Hetzner API

- **API Token:** stored in `docs/needs/step-2.md`
- **API Base URL:** `https://api.hetzner.cloud/v1`
