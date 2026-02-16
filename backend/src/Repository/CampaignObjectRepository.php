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

    /**
     * @return array<string, int>
     */
    public function countByTypeForUser(User $owner): array
    {
        $rows = $this->createQueryBuilder('co')
            ->select('co.type, COUNT(co.id) AS cnt')
            ->join('co.campaign', 'c')
            ->andWhere('c.owner = :owner')
            ->setParameter('owner', $owner)
            ->groupBy('co.type')
            ->getQuery()
            ->getScalarResult();

        $result = [];
        foreach ($rows as $row) {
            $result[$row['type']] = (int) $row['cnt'];
        }

        return $result;
    }

    /**
     * @return array<string, int>
     */
    public function countByStatusForUser(User $owner): array
    {
        $rows = $this->createQueryBuilder('co')
            ->select('co.status, COUNT(co.id) AS cnt')
            ->join('co.campaign', 'c')
            ->andWhere('c.owner = :owner')
            ->setParameter('owner', $owner)
            ->groupBy('co.status')
            ->getQuery()
            ->getScalarResult();

        $result = [];
        foreach ($rows as $row) {
            $result[$row['status']] = (int) $row['cnt'];
        }

        return $result;
    }

    public function countForUser(User $owner): int
    {
        return (int) $this->createQueryBuilder('co')
            ->select('COUNT(co.id)')
            ->join('co.campaign', 'c')
            ->andWhere('c.owner = :owner')
            ->setParameter('owner', $owner)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @return array<int, array{month: string, count: int}>
     */
    public function monthlyCreatedForUser(User $owner, int $months = 6): array
    {
        $since = new \DateTimeImmutable("-{$months} months");

        $rows = $this->getEntityManager()->getConnection()->executeQuery(
            "SELECT TO_CHAR(co.created_at, 'YYYY-MM') AS month, COUNT(co.id) AS cnt
             FROM campaign_object co
             JOIN campaign c ON co.campaign_id = c.id
             WHERE c.owner_id = :owner AND co.created_at >= :since
             GROUP BY month ORDER BY month ASC",
            ['owner' => $owner->getId()->toRfc4122(), 'since' => $since->format('Y-m-d H:i:s')]
        )->fetchAllAssociative();

        return array_map(fn (array $r) => ['month' => $r['month'], 'count' => (int) $r['cnt']], $rows);
    }
}
