<?php

namespace App\MessageHandler;

use App\Entity\Notification;
use App\Entity\User;
use App\Message\SendNotification;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final class SendNotificationHandler
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
        private readonly HubInterface $hub,
    ) {
    }

    public function __invoke(SendNotification $message): void
    {
        $user = $this->em->find(User::class, $message->getUserId());

        if (!$user) {
            $this->logger->warning('SendNotification: User not found', [
                'userId' => $message->getUserId(),
            ]);
            return;
        }

        $notification = new Notification();
        $notification->setUser($user);
        $notification->setType($message->getType());
        $notification->setTitle($message->getTitle());
        $notification->setMessage($message->getMessage());
        $notification->setData($message->getData());

        $this->em->persist($notification);
        $this->em->flush();

        // Publish real-time update via Mercure
        try {
            $this->hub->publish(new Update(
                'notifications/' . $message->getUserId(),
                json_encode([
                    'id' => $notification->getId()->toRfc4122(),
                    'type' => $notification->getType(),
                    'title' => $notification->getTitle(),
                    'message' => $notification->getMessage(),
                    'data' => $notification->getData(),
                    'isRead' => false,
                    'createdAt' => $notification->getCreatedAt()->format(\DateTimeInterface::ATOM),
                ]),
                true // private update
            ));
        } catch (\Throwable $e) {
            $this->logger->warning('Mercure publish failed', [
                'userId' => $message->getUserId(),
                'error' => $e->getMessage(),
            ]);
        }

        $this->logger->info('Notification created', [
            'userId' => $message->getUserId(),
            'type' => $message->getType(),
        ]);
    }
}
