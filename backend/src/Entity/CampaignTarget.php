<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Link;
use ApiPlatform\Metadata\Post;
use App\Repository\CampaignTargetRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: CampaignTargetRepository::class)]
#[ORM\UniqueConstraint(name: 'unique_campaign_account', columns: ['campaign_id', 'social_account_id'])]
#[ApiResource(
    uriTemplate: '/campaigns/{campaignId}/targets',
    operations: [
        new GetCollection(
            normalizationContext: ['groups' => ['target:read']],
        ),
        new Post(
            normalizationContext: ['groups' => ['target:read']],
            denormalizationContext: ['groups' => ['target:write']],
        ),
    ],
    uriVariables: [
        'campaignId' => new Link(
            fromClass: Campaign::class,
            fromProperty: 'campaignTargets',
        ),
    ],
    security: "is_granted('ROLE_USER')",
)]
#[ApiResource(
    uriTemplate: '/campaigns/{campaignId}/targets/{id}',
    operations: [
        new Delete(),
    ],
    uriVariables: [
        'campaignId' => new Link(
            fromClass: Campaign::class,
            fromProperty: 'campaignTargets',
        ),
        'id' => new Link(fromClass: CampaignTarget::class),
    ],
    security: "is_granted('ROLE_USER')",
)]
class CampaignTarget
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[Groups(['target:read'])]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: Campaign::class, inversedBy: 'campaignTargets')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['target:read'])]
    private ?Campaign $campaign = null;

    #[ORM\ManyToOne(targetEntity: SocialAccount::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['target:read', 'target:write'])]
    private ?SocialAccount $socialAccount = null;

    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => true])]
    #[Groups(['target:read', 'target:write'])]
    private bool $isActive = true;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['target:read'])]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
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

    public function getSocialAccount(): ?SocialAccount
    {
        return $this->socialAccount;
    }

    public function setSocialAccount(?SocialAccount $socialAccount): static
    {
        $this->socialAccount = $socialAccount;
        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
