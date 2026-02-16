<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\CampaignMemberRepository;
use App\State\CampaignMemberProcessor;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CampaignMemberRepository::class)]
#[ORM\Table(name: 'campaign_member')]
#[ORM\UniqueConstraint(name: 'unique_campaign_member', columns: ['campaign_id', 'user_id'])]
#[ApiResource(
    operations: [
        new Get(
            normalizationContext: ['groups' => ['member:read']],
            security: "is_granted('ROLE_USER')",
        ),
        new GetCollection(
            normalizationContext: ['groups' => ['member:read']],
        ),
        new Post(
            normalizationContext: ['groups' => ['member:read']],
            denormalizationContext: ['groups' => ['member:write']],
            security: "is_granted('ROLE_USER')",
            processor: CampaignMemberProcessor::class,
        ),
        new Patch(
            normalizationContext: ['groups' => ['member:read']],
            denormalizationContext: ['groups' => ['member:update']],
            security: "is_granted('ROLE_USER')",
        ),
        new Delete(
            security: "is_granted('ROLE_USER')",
        ),
    ],
    order: ['joinedAt' => 'DESC'],
    paginationItemsPerPage: 50,
)]
class CampaignMember
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[Groups(['member:read'])]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: Campaign::class, inversedBy: 'members')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['member:read', 'member:write'])]
    private ?Campaign $campaign = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Groups(['member:read', 'member:write'])]
    private ?User $user = null;

    #[ORM\Column(type: Types::STRING, length: 20)]
    #[Groups(['member:read', 'member:write', 'member:update'])]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['editor', 'viewer'])]
    private string $role = 'viewer';

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['member:read'])]
    private \DateTimeImmutable $joinedAt;

    public function __construct()
    {
        $this->joinedAt = new \DateTimeImmutable();
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

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function setRole(string $role): static
    {
        $this->role = $role;
        return $this;
    }

    public function getJoinedAt(): \DateTimeImmutable
    {
        return $this->joinedAt;
    }
}
