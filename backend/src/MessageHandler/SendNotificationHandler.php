<?php

namespace App\MessageHandler;

use App\Entity\Notification;
use App\Entity\User;
use App\Message\SendNotification;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler]
final class SendNotificationHandler
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly LoggerInterface $logger,
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

        $this->logger->info('Notification created', [
            'userId' => $message->getUserId(),
            'type' => $message->getType(),
        ]);
    }
}
