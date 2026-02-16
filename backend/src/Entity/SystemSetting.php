<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    operations: [
        new Get(
            normalizationContext: ['groups' => ['setting:read']],
            security: "is_granted('ROLE_ADMIN')",
        ),
        new GetCollection(
            normalizationContext: ['groups' => ['setting:read']],
            security: "is_granted('ROLE_ADMIN')",
        ),
        new Patch(
            normalizationContext: ['groups' => ['setting:read']],
            denormalizationContext: ['groups' => ['setting:update']],
            security: "is_granted('ROLE_ADMIN')",
        ),
    ],
    order: ['key' => 'ASC'],
)]
class SystemSetting
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[Groups(['setting:read'])]
    private ?Uuid $id = null;

    #[ORM\Column(name: '`key`', type: Types::STRING, length: 100, unique: true)]
    #[Groups(['setting:read'])]
    private ?string $key = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['setting:read', 'setting:update'])]
    private ?string $value = null;

    #[ORM\Column(type: Types::STRING, length: 20, options: ['default' => 'string'])]
    #[Groups(['setting:read'])]
    private string $type = 'string';

    #[ORM\Column(type: Types::STRING, length: 255, nullable: true)]
    #[Groups(['setting:read'])]
    private ?string $description = null;

    #[ORM\Column(type: Types::DATETIMETZ_IMMUTABLE)]
    #[Groups(['setting:read'])]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
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

    public function getKey(): ?string
    {
        return $this->key;
    }

    public function setKey(string $key): static
    {
        $this->key = $key;

        return $this;
    }

    public function getValue(): ?string
    {
        return $this->value;
    }

    public function setValue(string $value): static
    {
        $this->value = $value;

        return $this;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;

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

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }
}
