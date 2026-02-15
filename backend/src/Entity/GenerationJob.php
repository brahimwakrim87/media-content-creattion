<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use App\Repository\GenerationJobRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: GenerationJobRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    operations: [
        new Get(
            normalizationContext: ['groups' => ['generation:read']],
            security: "is_granted('ROLE_USER') and object.getRequestedBy() == user",
        ),
        new GetCollection(
            normalizationContext: ['groups' => ['generation:read']],
        ),
    ],
    order: ['createdAt' => 'DESC'],
    paginationItemsPerPage: 20,
)]
class GenerationJob
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[Groups(['generation:read'])]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: CampaignObject::class, inversedBy: 'generationJobs')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['generation:read'])]
    private ?CampaignObject $campaignObject = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['generation:read'])]
    private ?User $requestedBy = null;

    #[ORM\Column(type: Types::STRING, length: 50)]
    #[Groups(['generation:read'])]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['anthropic_claude', 'n8n_image', 'n8n_video'])]
    private ?string $provider = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['generation:read'])]
    #[Assert\NotBlank]
    private ?string $prompt = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['generation:read'])]
    private ?array $options = null;

    #[ORM\Column(type: Types::STRING, length: 50, options: ['default' => 'pending'])]
    #[Groups(['generation:read'])]
    #[Assert\Choice(choices: ['pending', 'processing', 'completed', 'failed'])]
    private string $status = 'pending';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['generation:read'])]
    private ?string $result = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['generation:read'])]
    private ?int $tokensUsed = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['generation:read'])]
    private ?int $processingTimeMs = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['generation:read'])]
    private ?string $errorMessage = null;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['generation:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['generation:read'])]
    private \DateTimeImmutable $updatedAt;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE, nullable: true)]
    #[Groups(['generation:read'])]
    private ?\DateTimeImmutable $completedAt = null;

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

    public function getRequestedBy(): ?User
    {
        return $this->requestedBy;
    }

    public function setRequestedBy(?User $requestedBy): static
    {
        $this->requestedBy = $requestedBy;
        return $this;
    }

    public function getProvider(): ?string
    {
        return $this->provider;
    }

    public function setProvider(string $provider): static
    {
        $this->provider = $provider;
        return $this;
    }

    public function getPrompt(): ?string
    {
        return $this->prompt;
    }

    public function setPrompt(string $prompt): static
    {
        $this->prompt = $prompt;
        return $this;
    }

    public function getOptions(): ?array
    {
        return $this->options;
    }

    public function setOptions(?array $options): static
    {
        $this->options = $options;
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

    public function getResult(): ?string
    {
        return $this->result;
    }

    public function setResult(?string $result): static
    {
        $this->result = $result;
        return $this;
    }

    public function getTokensUsed(): ?int
    {
        return $this->tokensUsed;
    }

    public function setTokensUsed(?int $tokensUsed): static
    {
        $this->tokensUsed = $tokensUsed;
        return $this;
    }

    public function getProcessingTimeMs(): ?int
    {
        return $this->processingTimeMs;
    }

    public function setProcessingTimeMs(?int $processingTimeMs): static
    {
        $this->processingTimeMs = $processingTimeMs;
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

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getCompletedAt(): ?\DateTimeImmutable
    {
        return $this->completedAt;
    }

    public function setCompletedAt(?\DateTimeImmutable $completedAt): static
    {
        $this->completedAt = $completedAt;
        return $this;
    }
}
