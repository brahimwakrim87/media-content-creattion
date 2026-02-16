<?php

namespace App\MessageHandler;

use App\Message\ProcessScheduledPublications;
use App\Message\SendNotification;
use App\Repository\PublicationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsMessageHandler]
final class ProcessScheduledPublicationsHandler
{
    public function __construct(
        private readonly PublicationRepository $publicationRepo,
        private readonly EntityManagerInterface $em,
        private readonly MessageBusInterface $messageBus,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function __invoke(ProcessScheduledPublications $message): void
    {
        $publications = $this->publicationRepo->findDueForPublishing();

        if (empty($publications)) {
            return;
        }

        $this->logger->info('Processing scheduled publications', [
            'count' => count($publications),
        ]);

        foreach ($publications as $publication) {
            try {
                $publication->setStatus('publishing');
                $this->em->flush();

                // Simulate publishing (future: trigger N8N workflow or direct API)
                $publication->setStatus('published');
                $publication->setPublishedAt(new \DateTimeImmutable());
                $this->em->flush();

                $owner = $publication->getCampaignObject()
                    ->getCampaign()
                    ->getOwner();

                $this->messageBus->dispatch(new SendNotification(
                    $owner->getId()->toRfc4122(),
                    'publication_published',
                    'Content Published',
                    sprintf(
                        'Your %s content "%s" has been published to %s.',
                        $publication->getPlatform(),
                        $publication->getCampaignObject()->getTitle() ?? 'Untitled',
                        $publication->getSocialAccount()->getAccountName(),
                    ),
                    ['publicationId' => $publication->getId()->toRfc4122()],
                ));

                $this->logger->info('Publication auto-published', [
                    'id' => $publication->getId()->toRfc4122(),
                ]);
            } catch (\Throwable $e) {
                $publication->setStatus('failed');
                $publication->setErrorMessage($e->getMessage());
                $publication->setRetryCount($publication->getRetryCount() + 1);
                $this->em->flush();

                $this->logger->error('Auto-publish failed', [
                    'id' => $publication->getId()->toRfc4122(),
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
