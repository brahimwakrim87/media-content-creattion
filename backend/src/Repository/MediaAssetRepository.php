<?php

namespace App\Repository;

use App\Entity\MediaAsset;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MediaAsset>
 */
class MediaAssetRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MediaAsset::class);
    }

    public function countByUser(User $user): int
    {
        return (int) $this->createQueryBuilder('m')
            ->select('COUNT(m.id)')
            ->andWhere('m.uploadedBy = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function totalSizeByUser(User $user): int
    {
        return (int) $this->createQueryBuilder('m')
            ->select('COALESCE(SUM(m.size), 0)')
            ->andWhere('m.uploadedBy = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @return string[]
     */
    public function foldersForUser(User $user): array
    {
        $rows = $this->createQueryBuilder('m')
            ->select('DISTINCT m.folder')
            ->andWhere('m.uploadedBy = :user')
            ->andWhere('m.folder IS NOT NULL')
            ->setParameter('user', $user)
            ->orderBy('m.folder', 'ASC')
            ->getQuery()
            ->getSingleColumnResult();

        return array_values(array_filter($rows));
    }
}
