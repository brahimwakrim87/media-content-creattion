<?php

namespace App\Repository;

use App\Entity\Comment;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

/**
 * @extends ServiceEntityRepository<Comment>
 */
class CommentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Comment::class);
    }

    /**
     * @return Comment[]
     */
    public function findByEntity(string $entityType, Uuid $entityId): array
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.entityType = :entityType')
            ->andWhere('c.entityId = :entityId')
            ->andWhere('c.parent IS NULL')
            ->setParameter('entityType', $entityType)
            ->setParameter('entityId', $entityId)
            ->orderBy('c.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function countByEntity(string $entityType, Uuid $entityId): int
    {
        return (int) $this->createQueryBuilder('c')
            ->select('COUNT(c.id)')
            ->andWhere('c.entityType = :entityType')
            ->andWhere('c.entityId = :entityId')
            ->setParameter('entityType', $entityType)
            ->setParameter('entityId', $entityId)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countForOwner(User $owner): int
    {
        $conn = $this->getEntityManager()->getConnection();
        $row = $conn->executeQuery(
            "SELECT COUNT(cm.id) AS cnt FROM comment cm
             WHERE (cm.entity_type = 'Campaign' AND cm.entity_id IN (SELECT c.id FROM campaign c WHERE c.owner_id = :owner))
             OR (cm.entity_type = 'CampaignObject' AND cm.entity_id IN (SELECT co.id FROM campaign_object co JOIN campaign c2 ON co.campaign_id = c2.id WHERE c2.owner_id = :owner))",
            ['owner' => $owner->getId()->toRfc4122()]
        )->fetchAssociative();

        return (int) ($row['cnt'] ?? 0);
    }
}
