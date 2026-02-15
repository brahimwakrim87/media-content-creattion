<?php

namespace App\Repository;

use App\Entity\Campaign;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Campaign>
 */
class CampaignRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Campaign::class);
    }

    /**
     * @return Campaign[]
     */
    public function findByOwnerAndStatus(User $owner, ?string $status = null): array
    {
        $qb = $this->createQueryBuilder('c')
            ->andWhere('c.owner = :owner')
            ->setParameter('owner', $owner)
            ->orderBy('c.createdAt', 'DESC');

        if ($status) {
            $qb->andWhere('c.status = :status')
                ->setParameter('status', $status);
        }

        return $qb->getQuery()->getResult();
    }

    public function countByOwner(User $owner): int
    {
        return (int) $this->createQueryBuilder('c')
            ->select('COUNT(c.id)')
            ->andWhere('c.owner = :owner')
            ->setParameter('owner', $owner)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
