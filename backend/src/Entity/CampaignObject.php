<?php

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Link;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\CampaignObjectRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CampaignObjectRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    operations: [
        new Get(
            normalizationContext: ['groups' => ['content:read']],
            security: "is_granted('ROLE_USER') and object.getCampaign().hasAccess(user)",
        ),
        new GetCollection(
            normalizationContext: ['groups' => ['content:read']],
        ),
        new Post(
            normalizationContext: ['groups' => ['content:read']],
            denormalizationContext: ['groups' => ['content:write']],
            security: "is_granted('ROLE_USER')",
        ),
        new Patch(
            normalizationContext: ['groups' => ['content:read']],
            denormalizationContext: ['groups' => ['content:update']],
            security: "is_granted('ROLE_USER') and object.getCampaign().canEdit(user)",
        ),
        new Delete(
            security: "is_granted('ROLE_USER') and object.getCampaign().getOwner() == user",
        ),
    ],
    order: ['createdAt' => 'DESC'],
    paginationItemsPerPage: 20,
)]
#[ApiResource(
    uriTemplate: '/campaigns/{campaignId}/objects',
    operations: [
        new GetCollection(
            normalizationContext: ['groups' => ['content:read']],
        ),
    ],
    uriVariables: [
        'campaignId' => new Link(
            fromClass: Campaign::class,
            fromProperty: 'campaignObjects',
        ),
    ],
)]
#[ApiFilter(SearchFilter::class, properties: ['title' => 'partial'])]
class CampaignObject
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[Groups(['content:read', 'campaign:item:read'])]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: Campaign::class, inversedBy: 'campaignObjects')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['content:read', 'content:write'])]
    private ?Campaign $campaign = null;

    #[ORM\Column(type: Types::STRING, length: 50)]
    #[Groups(['content:read', 'content:write', 'content:update', 'campaign:item:read'])]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['video', 'post', 'article', 'image', 'advertisement'])]
    private ?string $type = null;

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    #[Groups(['content:read', 'content:write', 'content:update', 'campaign:item:read'])]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['content:read', 'content:write', 'content:update', 'campaign:item:read'])]
    private ?string $content = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['content:read', 'content:update', 'campaign:item:read'])]
    private ?string $mediaUrl = null;

    #[ORM\Column(type: Types::STRING, length: 50, options: ['default' => 'draft'])]
    #[Groups(['content:read', 'content:update', 'campaign:item:read'])]
    #[Assert\Choice(choices: ['draft', 'generating', 'ready', 'approved', 'published'])]
    private string $status = 'draft';

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['content:read', 'campaign:item:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['content:read'])]
    private ?array $generationMeta = null;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['content:read'])]
    private \DateTimeImmutable $updatedAt;

    /** @var Collection<int, GenerationJob> */
    #[ORM\OneToMany(targetEntity: GenerationJob::class, mappedBy: 'campaignObject')]
    private Collection $generationJobs;

    /** @var Collection<int, Publication> */
    #[ORM\OneToMany(targetEntity: Publication::class, mappedBy: 'campaignObject', cascade: ['persist', 'remove'])]
    #[Groups(['content:item:read'])]
    private Collection $publications;

    /** @var Collection<int, Tag> */
    #[ORM\ManyToMany(targetEntity: Tag::class, inversedBy: 'campaignObjects')]
    #[ORM\JoinTable(name: 'campaign_object_tag')]
    #[Groups(['content:read', 'content:write', 'content:update'])]
    private Collection $tags;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
        $this->generationJobs = new ArrayCollection();
        $this->publications = new ArrayCollection();
        $this->tags = new ArrayCollection();
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

    public function getCampaign(): ?Campaign
    {
        return $this->campaign;
    }

    public function setCampaign(?Campaign $campaign): static
    {
        $this->campaign = $campaign;
        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;
        return $this;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(?string $title): static
    {
        $this->title = $title;
        return $this;
    }

    public function getContent(): ?string
    {
        return $this->content;
    }

    public function setContent(?string $content): static
    {
        $this->content = $content;
        return $this;
    }

    public function getMediaUrl(): ?string
    {
        return $this->mediaUrl;
    }

    public function setMediaUrl(?string $mediaUrl): static
    {
        $this->mediaUrl = $mediaUrl;
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

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getGenerationMeta(): ?array
    {
        return $this->generationMeta;
    }

    public function setGenerationMeta(?array $generationMeta): static
    {
        $this->generationMeta = $generationMeta;
        return $this;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    /** @return Collection<int, GenerationJob> */
    public function getGenerationJobs(): Collection
    {
        return $this->generationJobs;
    }

    public function addGenerationJob(GenerationJob $generationJob): static
    {
        if (!$this->generationJobs->contains($generationJob)) {
            $this->generationJobs->add($generationJob);
            $generationJob->setCampaignObject($this);
        }
        return $this;
    }

    public function removeGenerationJob(GenerationJob $generationJob): static
    {
        if ($this->generationJobs->removeElement($generationJob)) {
            if ($generationJob->getCampaignObject() === $this) {
                $generationJob->setCampaignObject(null);
            }
        }
        return $this;
    }

    /** @return Collection<int, Publication> */
    public function getPublications(): Collection
    {
        return $this->publications;
    }

    public function addPublication(Publication $publication): static
    {
        if (!$this->publications->contains($publication)) {
            $this->publications->add($publication);
            $publication->setCampaignObject($this);
        }
        return $this;
    }

    public function removePublication(Publication $publication): static
    {
        if ($this->publications->removeElement($publication)) {
            if ($publication->getCampaignObject() === $this) {
                $publication->setCampaignObject(null);
            }
        }
        return $this;
    }

    /** @return Collection<int, Tag> */
    public function getTags(): Collection
    {
        return $this->tags;
    }

    public function addTag(Tag $tag): static
    {
        if (!$this->tags->contains($tag)) {
            $this->tags->add($tag);
        }
        return $this;
    }

    public function removeTag(Tag $tag): static
    {
        $this->tags->removeElement($tag);
        return $this;
    }
}
