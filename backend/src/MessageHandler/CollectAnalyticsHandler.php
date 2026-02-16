<?php

namespace App\MessageHandler;

use App\Message\CollectAnalytics;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final class CollectAnalyticsHandler
{
    public function __construct(
        private readonly LoggerInterface $logger,
    ) {
    }

    public function __invoke(CollectAnalytics $message): void
    {
        $this->logger->info('CollectAnalytics: placeholder handler invoked', [
            'publicationId' => $message->getPublicationId(),
            'platform' => $message->getPlatform(),
        ]);

        // TODO: When social APIs are connected (Make.com integration),
        // fetch engagement metrics (likes, shares, comments, impressions)
        // and store them for analytics reporting.
    }
}
