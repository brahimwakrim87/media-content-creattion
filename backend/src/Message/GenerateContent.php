<?php

namespace App\Message;

final class GenerateContent
{
    public function __construct(
        private readonly string $generationJobId,
        private readonly string $campaignObjectId,
        private readonly string $contentType,
        private readonly string $prompt,
        private readonly ?array $options = null,
    ) {
    }

    public function getGenerationJobId(): string
    {
        return $this->generationJobId;
    }

    public function getCampaignObjectId(): string
    {
        return $this->campaignObjectId;
    }

    public function getContentType(): string
    {
        return $this->contentType;
    }

    public function getPrompt(): string
    {
        return $this->prompt;
    }

    public function getOptions(): ?array
    {
        return $this->options;
    }
}
