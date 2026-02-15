<?php

namespace App\Repository;

use App\Entity\CampaignObject;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CampaignObject>
 */
class CampaignObjectRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CampaignObject::class);
    }

    /**
     * @return CampaignObject[]
     */
    public function findByOwnerCampaigns(User $owner, ?string $type = null, ?string $status = null): array
    {
        $qb = $this->createQueryBuilder('co')
            ->join('co.campaign', 'c')
            ->andWhere('c.owner = :owner')
            ->setParameter('owner', $owner)
            ->orderBy('co.createdAt', 'DESC');

        if ($type) {
            $qb->andWhere('co.type = :type')
                ->setParameter('type', $type);
        }

        if ($status) {
            $qb->andWhere('co.status = :status')
                ->setParameter('status', $status);
        }

        return $qb->getQuery()->getResult();
    }
}
