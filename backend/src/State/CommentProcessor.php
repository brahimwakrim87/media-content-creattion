<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Campaign;
use App\Entity\CampaignObject;
use App\Entity\Comment;
use App\Entity\User;
use App\Message\SendNotification;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Uid\Uuid;

final class CommentProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly ProcessorInterface $persistProcessor,
        private readonly Security $security,
        private readonly EntityManagerInterface $em,
        private readonly MessageBusInterface $bus,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof Comment) {
            return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
        }

        $user = $this->security->getUser();
        $data->setAuthor($user);

        // Validate entity exists and user has access
        $campaign = $this->resolveCampaign($data->getEntityType(), $data->getEntityId());
        if (!$campaign) {
            throw new BadRequestHttpException('Referenced entity not found.');
        }

        if (!$campaign->hasAccess($user)) {
            throw new AccessDeniedHttpException('You do not have access to comment on this entity.');
        }

        // Validate parent belongs to same entity
        $parent = $data->getParent();
        if ($parent !== null) {
            if ($parent->getEntityType() !== $data->getEntityType() ||
                !$parent->getEntityId()->equals($data->getEntityId())) {
                throw new BadRequestHttpException('Reply must belong to the same entity as the parent comment.');
            }
            // Prevent nested replies (only one level deep)
            if ($parent->getParent() !== null) {
                throw new BadRequestHttpException('Nested replies are not allowed. Reply to the top-level comment instead.');
            }
        }

        // Parse @mentions
        $mentions = [];
        if (preg_match_all('/@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i', $data->getBody(), $matches)) {
            $mentions = array_unique($matches[1]);
        }
        $data->setMentions($mentions ?: null);

        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        // Send mention notifications
        foreach ($mentions as $mentionUuid) {
            $mentionedUser = $this->em->getRepository(User::class)->find(Uuid::fromString($mentionUuid));
            if (!$mentionedUser || $mentionedUser === $user) {
                continue;
            }
            if (!$campaign->hasAccess($mentionedUser)) {
                continue;
            }

            $authorName = trim(($user->getFirstName() ?? '') . ' ' . ($user->getLastName() ?? '')) ?: $user->getEmail();
            $this->bus->dispatch(new SendNotification(
                userId: $mentionUuid,
                type: 'mention',
                title: $authorName . ' mentioned you in a comment',
                message: mb_substr($data->getBody(), 0, 100),
                data: [
                    'entityType' => $data->getEntityType(),
                    'entityId' => $data->getEntityId()->toRfc4122(),
                    'commentId' => $data->getId()?->toRfc4122(),
                    'link' => $this->buildLink($data->getEntityType(), $data->getEntityId()),
                ],
            ));
        }

        return $result;
    }

    private function resolveCampaign(string $entityType, Uuid $entityId): ?Campaign
    {
        if ($entityType === 'Campaign') {
            return $this->em->getRepository(Campaign::class)->find($entityId);
        }

        if ($entityType === 'CampaignObject') {
            $obj = $this->em->getRepository(CampaignObject::class)->find($entityId);
            return $obj?->getCampaign();
        }

        return null;
    }

    private function buildLink(string $entityType, Uuid $entityId): string
    {
        return match ($entityType) {
            'Campaign' => '/dashboard/campaigns/' . $entityId->toRfc4122(),
            'CampaignObject' => '/dashboard/content/' . $entityId->toRfc4122(),
            default => '/dashboard',
        };
    }
}
