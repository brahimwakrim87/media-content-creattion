<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\SocialAccountRepository;
use App\State\SocialAccountProcessor;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: SocialAccountRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\UniqueConstraint(name: 'unique_platform_identifier', columns: ['platform', 'account_identifier'])]
#[UniqueEntity(fields: ['platform', 'accountIdentifier'], message: 'This account is already connected.')]
#[ApiResource(
    operations: [
        new Get(
            normalizationContext: ['groups' => ['account:read']],
            security: "is_granted('ROLE_USER')",
        ),
        new GetCollection(
            normalizationContext: ['groups' => ['account:read']],
            security: "is_granted('ROLE_USER')",
        ),
        new Post(
            normalizationContext: ['groups' => ['account:read']],
            denormalizationContext: ['groups' => ['account:write']],
            security: "is_granted('ROLE_ADMIN')",
            processor: SocialAccountProcessor::class,
        ),
        new Patch(
            normalizationContext: ['groups' => ['account:read']],
            denormalizationContext: ['groups' => ['account:update']],
            security: "is_granted('ROLE_ADMIN')",
        ),
        new Delete(
            security: "is_granted('ROLE_ADMIN')",
        ),
    ],
    order: ['createdAt' => 'DESC'],
    paginationItemsPerPage: 20,
)]
class SocialAccount
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[Groups(['account:read', 'target:read', 'publication:read'])]
    private ?Uuid $id = null;

    #[ORM\Column(type: Types::STRING, length: 50)]
    #[Groups(['account:read', 'account:write', 'target:read', 'publication:read'])]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['facebook', 'instagram', 'youtube', 'linkedin', 'tiktok', 'twitter'])]
    private ?string $platform = null;

    #[ORM\Column(type: Types::STRING, length: 255)]
    #[Groups(['account:read', 'account:write', 'account:update', 'target:read', 'publication:read'])]
    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    private ?string $accountName = null;

    #[ORM\Column(type: Types::STRING, length: 50, nullable: true)]
    #[Groups(['account:read', 'account:write', 'account:update'])]
    #[Assert\Choice(choices: ['page', 'profile', 'business', 'channel'], groups: ['Default'])]
    private ?string $accountType = null;

    #[ORM\Column(type: Types::STRING, length: 255)]
    #[Groups(['account:read', 'account:write'])]
    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    private ?string $accountIdentifier = null;

    #[ORM\Column(type: Types::BIGINT, nullable: true)]
    #[Groups(['account:read', 'account:update'])]
    private ?string $makeConnectionId = null;

    #[ORM\Column(type: Types::BIGINT, nullable: true)]
    #[Groups(['account:read', 'account:update'])]
    private ?string $makeScenarioId = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['account:read', 'account:update'])]
    private ?string $webhookUrl = null;

    #[ORM\Column(type: Types::STRING, length: 50, options: ['default' => 'active'])]
    #[Groups(['account:read', 'account:update', 'target:read'])]
    #[Assert\Choice(choices: ['active', 'expired', 'revoked', 'error'])]
    private string $status = 'active';

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['account:read'])]
    private ?User $createdBy = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['account:read', 'account:write', 'account:update'])]
    private ?array $metadata = null;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['account:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['account:read'])]
    private \DateTimeImmutable $updatedAt;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE, nullable: true)]
    #[Groups(['account:read', 'account:update'])]
    private ?\DateTimeImmutable $expiresAt = null;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE, nullable: true)]
    #[Groups(['account:read'])]
    private ?\DateTimeImmutable $lastUsedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getPlatform(): ?string
    {
        return $this->platform;
    }

    public function setPlatform(string $platform): static
    {
        $this->platform = $platform;
        return $this;
    }

    public function getAccountName(): ?string
    {
        return $this->accountName;
    }

    public function setAccountName(string $accountName): static
    {
        $this->accountName = $accountName;
        return $this;
    }

    public function getAccountType(): ?string
    {
        return $this->accountType;
    }

    public function setAccountType(?string $accountType): static
    {
        $this->accountType = $accountType;
        return $this;
    }

    public function getAccountIdentifier(): ?string
    {
        return $this->accountIdentifier;
    }

    public function setAccountIdentifier(string $accountIdentifier): static
    {
        $this->accountIdentifier = $accountIdentifier;
        return $this;
    }

    public function getMakeConnectionId(): ?string
    {
        return $this->makeConnectionId;
    }

    public function setMakeConnectionId(?string $makeConnectionId): static
    {
        $this->makeConnectionId = $makeConnectionId;
        return $this;
    }

    public function getMakeScenarioId(): ?string
    {
        return $this->makeScenarioId;
    }

    public function setMakeScenarioId(?string $makeScenarioId): static
    {
        $this->makeScenarioId = $makeScenarioId;
        return $this;
    }

    public function getWebhookUrl(): ?string
    {
        return $this->webhookUrl;
    }

    public function setWebhookUrl(?string $webhookUrl): static
    {
        $this->webhookUrl = $webhookUrl;
        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): static
    {
        $this->createdBy = $createdBy;
        return $this;
    }

    public function getMetadata(): ?array
    {
        return $this->metadata;
    }

    public function setMetadata(?array $metadata): static
    {
        $this->metadata = $metadata;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getExpiresAt(): ?\DateTimeImmutable
    {
        return $this->expiresAt;
    }

    public function setExpiresAt(?\DateTimeImmutable $expiresAt): static
    {
        $this->expiresAt = $expiresAt;
        return $this;
    }

    public function getLastUsedAt(): ?\DateTimeImmutable
    {
        return $this->lastUsedAt;
    }

    public function setLastUsedAt(?\DateTimeImmutable $lastUsedAt): static
    {
        $this->lastUsedAt = $lastUsedAt;
        return $this;
    }
}
