<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use App\Repository\MediaAssetRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: MediaAssetRepository::class)]
#[ORM\Index(columns: ['uploaded_by_id', 'created_at'], name: 'idx_media_user_created')]
#[ApiResource(
    operations: [
        new Get(
            normalizationContext: ['groups' => ['media:read']],
            security: "is_granted('ROLE_USER') and object.getUploadedBy() == user",
        ),
        new GetCollection(
            normalizationContext: ['groups' => ['media:read']],
        ),
        new Patch(
            normalizationContext: ['groups' => ['media:read']],
            denormalizationContext: ['groups' => ['media:update']],
            security: "is_granted('ROLE_USER') and object.getUploadedBy() == user",
        ),
        new Delete(
            security: "is_granted('ROLE_USER') and object.getUploadedBy() == user",
        ),
    ],
    order: ['createdAt' => 'DESC'],
    paginationItemsPerPage: 24,
)]
#[ApiFilter(SearchFilter::class, properties: [
    'mimeType' => 'partial',
    'originalFilename' => 'partial',
    'folder' => 'exact',
])]
class MediaAsset
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[Groups(['media:read'])]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['media:read'])]
    private ?User $uploadedBy = null;

    #[ORM\Column(type: Types::STRING, length: 255)]
    #[Groups(['media:read'])]
    private string $originalFilename = '';

    #[ORM\Column(type: Types::STRING, length: 255)]
    #[Groups(['media:read'])]
    private string $filename = '';

    #[ORM\Column(type: Types::STRING, length: 100)]
    #[Groups(['media:read'])]
    private string $mimeType = '';

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['media:read'])]
    private int $size = 0;

    #[ORM\Column(type: Types::STRING, length: 500)]
    #[Groups(['media:read'])]
    private string $url = '';

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    #[Assert\Length(max: 255)]
    #[Groups(['media:read', 'media:update'])]
    private ?string $alt = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['media:read', 'media:update'])]
    private ?array $tags = null;

    #[ORM\Column(type: Types::STRING, length: 100, nullable: true)]
    #[Assert\Length(max: 100)]
    #[Groups(['media:read', 'media:update'])]
    private ?string $folder = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['media:read'])]
    private ?int $width = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['media:read'])]
    private ?int $height = null;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['media:read'])]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?Uuid { return $this->id; }

    public function getUploadedBy(): ?User { return $this->uploadedBy; }
    public function setUploadedBy(?User $uploadedBy): static { $this->uploadedBy = $uploadedBy; return $this; }

    public function getOriginalFilename(): string { return $this->originalFilename; }
    public function setOriginalFilename(string $originalFilename): static { $this->originalFilename = $originalFilename; return $this; }

    public function getFilename(): string { return $this->filename; }
    public function setFilename(string $filename): static { $this->filename = $filename; return $this; }

    public function getMimeType(): string { return $this->mimeType; }
    public function setMimeType(string $mimeType): static { $this->mimeType = $mimeType; return $this; }

    public function getSize(): int { return $this->size; }
    public function setSize(int $size): static { $this->size = $size; return $this; }

    public function getUrl(): string { return $this->url; }
    public function setUrl(string $url): static { $this->url = $url; return $this; }

    public function getAlt(): ?string { return $this->alt; }
    public function setAlt(?string $alt): static { $this->alt = $alt; return $this; }

    public function getTags(): ?array { return $this->tags; }
    public function setTags(?array $tags): static { $this->tags = $tags; return $this; }

    public function getFolder(): ?string { return $this->folder; }
    public function setFolder(?string $folder): static { $this->folder = $folder; return $this; }

    public function getWidth(): ?int { return $this->width; }
    public function setWidth(?int $width): static { $this->width = $width; return $this; }

    public function getHeight(): ?int { return $this->height; }
    public function setHeight(?int $height): static { $this->height = $height; return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }

    #[Groups(['media:read'])]
    public function getMediaType(): string
    {
        if (str_starts_with($this->mimeType, 'image/')) return 'image';
        if (str_starts_with($this->mimeType, 'video/')) return 'video';
        return 'other';
    }
}
