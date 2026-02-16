<?php

namespace App\Message;

final class ProcessScheduledPublications
{
    public function __construct(
        private readonly \DateTimeImmutable $dispatchedAt = new \DateTimeImmutable(),
    ) {
    }

    public function getDispatchedAt(): \DateTimeImmutable
    {
        return $this->dispatchedAt;
    }
}
