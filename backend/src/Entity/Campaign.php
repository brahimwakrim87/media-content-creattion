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
use App\Repository\CampaignRepository;
use App\State\CampaignProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CampaignRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    operations: [
        new Get(
            normalizationContext: ['groups' => ['campaign:read', 'campaign:item:read']],
            security: "is_granted('ROLE_USER') and object.getOwner() == user",
        ),
        new GetCollection(
            normalizationContext: ['groups' => ['campaign:read']],
        ),
        new Post(
            normalizationContext: ['groups' => ['campaign:read']],
            denormalizationContext: ['groups' => ['campaign:write']],
            security: "is_granted('ROLE_USER')",
            processor: CampaignProcessor::class,
        ),
        new Patch(
            normalizationContext: ['groups' => ['campaign:read']],
            denormalizationContext: ['groups' => ['campaign:update']],
            security: "is_granted('ROLE_USER') and object.getOwner() == user",
        ),
        new Delete(
            security: "is_granted('ROLE_USER') and object.getOwner() == user",
        ),
    ],
    order: ['createdAt' => 'DESC'],
    paginationItemsPerPage: 20,
)]
#[ApiFilter(SearchFilter::class, properties: ['name' => 'partial'])]
#[ApiFilter(DateFilter::class, properties: ['startDate', 'endDate'])]
class Campaign
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[Groups(['campaign:read', 'content:read'])]
    private ?Uuid $id = null;

    #[ORM\Column(type: Types::STRING, length: 255)]
    #[Groups(['campaign:read', 'campaign:write', 'campaign:update', 'content:read'])]
    #[Assert\NotBlank]
    #[Assert\Length(max: 255)]
    private ?string $name = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['campaign:read', 'campaign:write', 'campaign:update'])]
    private ?string $description = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['campaign:read'])]
    private ?User $owner = null;

    #[ORM\Column(type: Types::STRING, length: 50, options: ['default' => 'draft'])]
    #[Groups(['campaign:read', 'campaign:write', 'campaign:update', 'content:read'])]
    #[Assert\Choice(choices: ['draft', 'active', 'paused', 'completed'])]
    private string $status = 'draft';

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['campaign:read', 'campaign:write', 'campaign:update'])]
    private ?array $goals = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['campaign:read', 'campaign:write', 'campaign:update'])]
    private ?string $budget = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    #[Groups(['campaign:read', 'campaign:write', 'campaign:update'])]
    private ?\DateTimeImmutable $startDate = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    #[Groups(['campaign:read', 'campaign:write', 'campaign:update'])]
    private ?\DateTimeImmutable $endDate = null;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['campaign:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['campaign:read'])]
    private \DateTimeImmutable $updatedAt;

    /** @var Collection<int, CampaignObject> */
    #[ORM\OneToMany(targetEntity: CampaignObject::class, mappedBy: 'campaign', cascade: ['persist', 'remove'])]
    #[Groups(['campaign:item:read'])]
    private Collection $campaignObjects;

    /** @var Collection<int, CampaignTarget> */
    #[ORM\OneToMany(targetEntity: CampaignTarget::class, mappedBy: 'campaign', cascade: ['persist', 'remove'])]
    #[Groups(['campaign:item:read'])]
    private Collection $campaignTargets;

    /** @var Collection<int, Tag> */
    #[ORM\ManyToMany(targetEntity: Tag::class, inversedBy: 'campaigns')]
    #[ORM\JoinTable(name: 'campaign_tag')]
    #[Groups(['campaign:read', 'campaign:write', 'campaign:update'])]
    private Collection $tags;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
        $this->campaignObjects = new ArrayCollection();
        $this->campaignTargets = new ArrayCollection();
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

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): static
    {
        $this->owner = $owner;
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

    public function getGoals(): ?array
    {
        return $this->goals;
    }

    public function setGoals(?array $goals): static
    {
        $this->goals = $goals;
        return $this;
    }

    public function getBudget(): ?string
    {
        return $this->budget;
    }

    public function setBudget(?string $budget): static
    {
        $this->budget = $budget;
        return $this;
    }

    public function getStartDate(): ?\DateTimeImmutable
    {
        return $this->startDate;
    }

    public function setStartDate(?\DateTimeImmutable $startDate): static
    {
        $this->startDate = $startDate;
        return $this;
    }

    public function getEndDate(): ?\DateTimeImmutable
    {
        return $this->endDate;
    }

    public function setEndDate(?\DateTimeImmutable $endDate): static
    {
        $this->endDate = $endDate;
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

    /** @return Collection<int, CampaignObject> */
    public function getCampaignObjects(): Collection
    {
        return $this->campaignObjects;
    }

    public function addCampaignObject(CampaignObject $campaignObject): static
    {
        if (!$this->campaignObjects->contains($campaignObject)) {
            $this->campaignObjects->add($campaignObject);
            $campaignObject->setCampaign($this);
        }
        return $this;
    }

    public function removeCampaignObject(CampaignObject $campaignObject): static
    {
        if ($this->campaignObjects->removeElement($campaignObject)) {
            if ($campaignObject->getCampaign() === $this) {
                $campaignObject->setCampaign(null);
            }
        }
        return $this;
    }

    /** @return Collection<int, CampaignTarget> */
    public function getCampaignTargets(): Collection
    {
        return $this->campaignTargets;
    }

    public function addCampaignTarget(CampaignTarget $campaignTarget): static
    {
        if (!$this->campaignTargets->contains($campaignTarget)) {
            $this->campaignTargets->add($campaignTarget);
            $campaignTarget->setCampaign($this);
        }
        return $this;
    }

    public function removeCampaignTarget(CampaignTarget $campaignTarget): static
    {
        if ($this->campaignTargets->removeElement($campaignTarget)) {
            if ($campaignTarget->getCampaign() === $this) {
                $campaignTarget->setCampaign(null);
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
