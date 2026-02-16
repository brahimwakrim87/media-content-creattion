<?php

namespace App\Controller;

use App\Entity\AuditLog;
use App\Entity\Campaign;
use App\Entity\CampaignObject;
use App\Entity\Comment;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

class ActivityFeedController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('/api/campaigns/{id}/activity', methods: ['GET'], priority: 10)]
    public function campaignActivity(string $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $user = $this->getUser();

        $campaign = $this->em->getRepository(Campaign::class)->find(Uuid::fromString($id));
        if (!$campaign || !$campaign->hasAccess($user)) {
            throw $this->createAccessDeniedException();
        }

        // Collect content IDs for this campaign
        $contentIds = [];
        foreach ($campaign->getCampaignObjects() as $obj) {
            $contentIds[] = $obj->getId()->toRfc4122();
        }

        // Fetch audit logs for campaign and its content
        $auditEntries = $this->fetchAuditLogs($id, $contentIds);

        // Fetch comments for campaign and its content
        $comments = $this->fetchComments('Campaign', $id, $contentIds);

        // Merge and sort by date
        $items = array_merge($auditEntries, $comments);
        usort($items, fn($a, $b) => strtotime($b['createdAt']) - strtotime($a['createdAt']));

        return $this->json(array_slice($items, 0, 50));
    }

    #[Route('/api/campaign_objects/{id}/activity', methods: ['GET'], priority: 10)]
    public function contentActivity(string $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $user = $this->getUser();

        $content = $this->em->getRepository(CampaignObject::class)->find(Uuid::fromString($id));
        if (!$content || !$content->getCampaign()->hasAccess($user)) {
            throw $this->createAccessDeniedException();
        }

        $auditEntries = $this->fetchAuditLogs(null, [$id]);
        $comments = $this->fetchComments('CampaignObject', $id, []);

        $items = array_merge($auditEntries, $comments);
        usort($items, fn($a, $b) => strtotime($b['createdAt']) - strtotime($a['createdAt']));

        return $this->json(array_slice($items, 0, 50));
    }

    private function fetchAuditLogs(?string $campaignId, array $contentIds): array
    {
        $qb = $this->em->createQueryBuilder()
            ->select('a')
            ->from(AuditLog::class, 'a')
            ->orderBy('a.createdAt', 'DESC')
            ->setMaxResults(100);

        $conditions = [];
        $params = [];

        if ($campaignId) {
            $conditions[] = "(a.entityType = 'Campaign' AND a.entityId = :campaignId)";
            $params['campaignId'] = $campaignId;
        }

        if (!empty($contentIds)) {
            $conditions[] = "(a.entityType = 'CampaignObject' AND a.entityId IN (:contentIds))";
            $params['contentIds'] = $contentIds;

            $conditions[] = "(a.entityType = 'CampaignMember' AND a.entityId IS NOT NULL)";
        }

        if (empty($conditions)) {
            return [];
        }

        $qb->andWhere(implode(' OR ', $conditions));
        foreach ($params as $key => $value) {
            $qb->setParameter($key, $value);
        }

        $logs = $qb->getQuery()->getResult();
        $items = [];

        foreach ($logs as $log) {
            $userData = null;
            $logUser = $log->getUser();
            if ($logUser) {
                $userData = [
                    'id' => $logUser->getId()->toRfc4122(),
                    'firstName' => $logUser->getFirstName(),
                    'lastName' => $logUser->getLastName(),
                    'avatarUrl' => $logUser->getAvatarUrl(),
                ];
            }

            $details = [];
            $newValues = $log->getNewValues();
            $oldValues = $log->getOldValues();
            if ($newValues) {
                if (isset($newValues['status'])) {
                    $details['field'] = 'status';
                    $details['new'] = $newValues['status'];
                    $details['old'] = $oldValues['status'] ?? null;
                }
                if (isset($newValues['title'])) {
                    $details['title'] = $newValues['title'];
                }
                if (isset($newValues['name'])) {
                    $details['title'] = $newValues['name'];
                }
            }

            $items[] = [
                'type' => 'audit',
                'action' => $log->getAction(),
                'entityType' => $log->getEntityType(),
                'entityId' => $log->getEntityId(),
                'user' => $userData,
                'details' => $details ?: null,
                'createdAt' => $log->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ];
        }

        return $items;
    }

    private function fetchComments(string $entityType, string $entityId, array $extraContentIds): array
    {
        $qb = $this->em->createQueryBuilder()
            ->select('c')
            ->from(Comment::class, 'c')
            ->andWhere('c.parent IS NULL')
            ->orderBy('c.createdAt', 'DESC')
            ->setMaxResults(100);

        $conditions = [];
        $conditions[] = "(c.entityType = :entityType AND c.entityId = :entityId)";
        $qb->setParameter('entityType', $entityType);
        $qb->setParameter('entityId', $entityId);

        if (!empty($extraContentIds)) {
            $conditions[] = "(c.entityType = 'CampaignObject' AND c.entityId IN (:extraIds))";
            $qb->setParameter('extraIds', $extraContentIds);
        }

        $qb->andWhere(implode(' OR ', $conditions));

        $comments = $qb->getQuery()->getResult();
        $items = [];

        foreach ($comments as $comment) {
            $author = $comment->getAuthor();
            $items[] = [
                'type' => 'comment',
                'id' => $comment->getId()->toRfc4122(),
                'entityType' => $comment->getEntityType(),
                'entityId' => $comment->getEntityId()->toRfc4122(),
                'user' => [
                    'id' => $author->getId()->toRfc4122(),
                    'firstName' => $author->getFirstName(),
                    'lastName' => $author->getLastName(),
                    'avatarUrl' => $author->getAvatarUrl(),
                ],
                'body' => $comment->getBody(),
                'createdAt' => $comment->getCreatedAt()->format(\DateTimeInterface::ATOM),
            ];
        }

        return $items;
    }
}
