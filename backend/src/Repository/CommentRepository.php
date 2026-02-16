<?php

namespace App\Repository;

use App\Entity\Comment;
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
}
