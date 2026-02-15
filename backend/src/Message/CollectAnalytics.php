<?php

namespace App\Message;

final class CollectAnalytics
{
    public function __construct(
        private readonly string $publicationId,
        private readonly string $platform,
    ) {
    }

    public function getPublicationId(): string
    {
        return $this->publicationId;
    }

    public function getPlatform(): string
    {
        return $this->platform;
    }
}
