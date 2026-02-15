<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\TagRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TagRepository::class)]
#[UniqueEntity(fields: ['name'], message: 'This tag name already exists.')]
#[ApiResource(
    operations: [
        new Get(normalizationContext: ['groups' => ['tag:read']]),
        new GetCollection(normalizationContext: ['groups' => ['tag:read']]),
        new Post(
            normalizationContext: ['groups' => ['tag:read']],
            denormalizationContext: ['groups' => ['tag:write']],
            security: "is_granted('ROLE_USER')",
        ),
        new Patch(
            normalizationContext: ['groups' => ['tag:read']],
            denormalizationContext: ['groups' => ['tag:write']],
            security: "is_granted('ROLE_USER')",
        ),
        new Delete(
            security: "is_granted('ROLE_USER')",
        ),
    ],
    order: ['name' => 'ASC'],
)]
class Tag
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[Groups(['tag:read', 'campaign:read', 'content:read'])]
    private ?Uuid $id = null;

    #[ORM\Column(type: Types::STRING, length: 100, unique: true)]
    #[Groups(['tag:read', 'tag:write', 'campaign:read', 'content:read'])]
    #[Assert\NotBlank]
    #[Assert\Length(max: 100)]
    private ?string $name = null;

    #[ORM\Column(type: Types::STRING, length: 7, nullable: true)]
    #[Groups(['tag:read', 'tag:write', 'campaign:read', 'content:read'])]
    #[Assert\Regex(pattern: '/^#[0-9A-Fa-f]{6}$/', message: 'Color must be a valid hex color (e.g. #FF5733)')]
    private ?string $color = null;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['tag:read'])]
    private \DateTimeImmutable $createdAt;

    /** @var Collection<int, Campaign> */
    #[ORM\ManyToMany(targetEntity: Campaign::class, mappedBy: 'tags')]
    private Collection $campaigns;

    /** @var Collection<int, CampaignObject> */
    #[ORM\ManyToMany(targetEntity: CampaignObject::class, mappedBy: 'tags')]
    private Collection $campaignObjects;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->campaigns = new ArrayCollection();
        $this->campaignObjects = new ArrayCollection();
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

    public function getColor(): ?string
    {
        return $this->color;
    }

    public function setColor(?string $color): static
    {
        $this->color = $color;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    /** @return Collection<int, Campaign> */
    public function getCampaigns(): Collection
    {
        return $this->campaigns;
    }

    public function addCampaign(Campaign $campaign): static
    {
        if (!$this->campaigns->contains($campaign)) {
            $this->campaigns->add($campaign);
            $campaign->addTag($this);
        }
        return $this;
    }

    public function removeCampaign(Campaign $campaign): static
    {
        if ($this->campaigns->removeElement($campaign)) {
            $campaign->removeTag($this);
        }
        return $this;
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
            $campaignObject->addTag($this);
        }
        return $this;
    }

    public function removeCampaignObject(CampaignObject $campaignObject): static
    {
        if ($this->campaignObjects->removeElement($campaignObject)) {
            $campaignObject->removeTag($this);
        }
        return $this;
    }
}
