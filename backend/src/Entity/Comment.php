<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\CommentRepository;
use App\State\CommentProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CommentRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\Index(name: 'idx_comment_entity', columns: ['entity_type', 'entity_id'])]
#[ApiResource(
    operations: [
        new Get(
            normalizationContext: ['groups' => ['comment:read']],
            security: "is_granted('ROLE_USER')",
        ),
        new Post(
            normalizationContext: ['groups' => ['comment:read']],
            denormalizationContext: ['groups' => ['comment:write']],
            security: "is_granted('ROLE_USER')",
            processor: CommentProcessor::class,
        ),
        new Patch(
            normalizationContext: ['groups' => ['comment:read']],
            denormalizationContext: ['groups' => ['comment:update']],
            security: "is_granted('ROLE_USER') and object.getAuthor() == user",
        ),
        new Delete(
            security: "is_granted('ROLE_USER') and object.getAuthor() == user",
        ),
    ],
    order: ['createdAt' => 'ASC'],
    paginationItemsPerPage: 50,
)]
#[ApiFilter(SearchFilter::class, properties: ['entityType' => 'exact', 'entityId' => 'exact'])]
class Comment
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[Groups(['comment:read'])]
    private ?Uuid $id = null;

    #[ORM\Column(type: Types::STRING, length: 50)]
    #[Groups(['comment:read', 'comment:write'])]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['Campaign', 'CampaignObject'])]
    private ?string $entityType = null;

    #[ORM\Column(type: 'uuid')]
    #[Groups(['comment:read', 'comment:write'])]
    #[Assert\NotBlank]
    private ?Uuid $entityId = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['comment:read'])]
    private ?User $author = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'replies')]
    #[ORM\JoinColumn(onDelete: 'CASCADE')]
    #[Groups(['comment:write'])]
    private ?self $parent = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['comment:read', 'comment:write', 'comment:update'])]
    #[Assert\NotBlank]
    private ?string $body = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['comment:read'])]
    private ?array $mentions = null;

    /** @var Collection<int, self> */
    #[ORM\OneToMany(targetEntity: self::class, mappedBy: 'parent', cascade: ['remove'])]
    #[Groups(['comment:read'])]
    private Collection $replies;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['comment:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['comment:read'])]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
        $this->replies = new ArrayCollection();
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

    public function getEntityType(): ?string
    {
        return $this->entityType;
    }

    public function setEntityType(string $entityType): static
    {
        $this->entityType = $entityType;
        return $this;
    }

    public function getEntityId(): ?Uuid
    {
        return $this->entityId;
    }

    public function setEntityId(Uuid $entityId): static
    {
        $this->entityId = $entityId;
        return $this;
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): static
    {
        $this->author = $author;
        return $this;
    }

    public function getParent(): ?self
    {
        return $this->parent;
    }

    public function setParent(?self $parent): static
    {
        $this->parent = $parent;
        return $this;
    }

    public function getBody(): ?string
    {
        return $this->body;
    }

    public function setBody(string $body): static
    {
        $this->body = $body;
        return $this;
    }

    public function getMentions(): ?array
    {
        return $this->mentions;
    }

    public function setMentions(?array $mentions): static
    {
        $this->mentions = $mentions;
        return $this;
    }

    /** @return Collection<int, self> */
    public function getReplies(): Collection
    {
        return $this->replies;
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
