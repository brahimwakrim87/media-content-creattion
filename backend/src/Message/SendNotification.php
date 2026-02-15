<?php

namespace App\Message;

final class SendNotification
{
    public function __construct(
        private readonly string $userId,
        private readonly string $type,
        private readonly string $title,
        private readonly ?string $message = null,
        private readonly ?array $data = null,
    ) {
    }

    public function getUserId(): string
    {
        return $this->userId;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getMessage(): ?string
    {
        return $this->message;
    }

    public function getData(): ?array
    {
        return $this->data;
    }
}
