<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\DateFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\PublicationRepository;
use App\State\PublicationProcessor;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: PublicationRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    operations: [
        new Get(
            normalizationContext: ['groups' => ['publication:read', 'publication:item:read']],
            security: "is_granted('ROLE_USER') and object.getCampaignObject().getCampaign().getOwner() == user",
        ),
        new GetCollection(
            normalizationContext: ['groups' => ['publication:read']],
        ),
        new Post(
            normalizationContext: ['groups' => ['publication:read']],
            denormalizationContext: ['groups' => ['publication:write']],
            security: "is_granted('ROLE_USER')",
            processor: PublicationProcessor::class,
        ),
        new Patch(
            normalizationContext: ['groups' => ['publication:read']],
            denormalizationContext: ['groups' => ['publication:update']],
            security: "is_granted('ROLE_USER') and object.getCampaignObject().getCampaign().getOwner() == user",
        ),
        new Delete(
            security: "is_granted('ROLE_USER') and object.getCampaignObject().getCampaign().getOwner() == user",
        ),
    ],
    order: ['createdAt' => 'DESC'],
    paginationItemsPerPage: 20,
)]
#[ApiFilter(SearchFilter::class, properties: ['platform' => 'exact'])]
#[ApiFilter(DateFilter::class, properties: ['scheduledAt', 'publishedAt'])]
class Publication
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[Groups(['publication:read'])]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: CampaignObject::class, inversedBy: 'publications')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['publication:read', 'publication:write'])]
    private ?CampaignObject $campaignObject = null;

    #[ORM\ManyToOne(targetEntity: SocialAccount::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    #[Groups(['publication:read', 'publication:write'])]
    private ?SocialAccount $socialAccount = null;

    #[ORM\Column(type: Types::STRING, length: 50)]
    #[Groups(['publication:read'])]
    private ?string $platform = null;

    #[ORM\Column(type: Types::STRING, length: 50, options: ['default' => 'draft'])]
    #[Groups(['publication:read', 'publication:update'])]
    #[Assert\Choice(choices: ['draft', 'scheduled', 'publishing', 'published', 'failed'])]
    private string $status = 'draft';

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    #[Groups(['publication:item:read', 'publication:update'])]
    private ?string $externalId = null;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE, nullable: true)]
    #[Groups(['publication:read', 'publication:write', 'publication:update'])]
    private ?\DateTimeImmutable $scheduledAt = null;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE, nullable: true)]
    #[Groups(['publication:read', 'publication:update'])]
    private ?\DateTimeImmutable $publishedAt = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['publication:item:read', 'publication:update'])]
    private ?string $errorMessage = null;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    #[Groups(['publication:item:read', 'publication:update'])]
    private int $retryCount = 0;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['publication:item:read', 'publication:update'])]
    private ?array $metadata = null;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['publication:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['publication:read'])]
    private \DateTimeImmutable $updatedAt;

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

    public function getCampaignObject(): ?CampaignObject
    {
        return $this->campaignObject;
    }

    public function setCampaignObject(?CampaignObject $campaignObject): static
    {
        $this->campaignObject = $campaignObject;
        return $this;
    }

    public function getSocialAccount(): ?SocialAccount
    {
        return $this->socialAccount;
    }

    public function setSocialAccount(?SocialAccount $socialAccount): static
    {
        $this->socialAccount = $socialAccount;
        return $this;
    }

    public function getPlatform(): ?string
    {
        return $this->platform;
    }

    public function setPlatform(?string $platform): static
    {
        $this->platform = $platform;
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

    public function getExternalId(): ?string
    {
        return $this->externalId;
    }

    public function setExternalId(?string $externalId): static
    {
        $this->externalId = $externalId;
        return $this;
    }

    public function getScheduledAt(): ?\DateTimeImmutable
    {
        return $this->scheduledAt;
    }

    public function setScheduledAt(?\DateTimeImmutable $scheduledAt): static
    {
        $this->scheduledAt = $scheduledAt;
        return $this;
    }

    public function getPublishedAt(): ?\DateTimeImmutable
    {
        return $this->publishedAt;
    }

    public function setPublishedAt(?\DateTimeImmutable $publishedAt): static
    {
        $this->publishedAt = $publishedAt;
        return $this;
    }

    public function getErrorMessage(): ?string
    {
        return $this->errorMessage;
    }

    public function setErrorMessage(?string $errorMessage): static
    {
        $this->errorMessage = $errorMessage;
        return $this;
    }

    public function getRetryCount(): int
    {
        return $this->retryCount;
    }

    public function setRetryCount(int $retryCount): static
    {
        $this->retryCount = $retryCount;
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
}
