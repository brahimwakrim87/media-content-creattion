<?php

namespace App\Repository;

use App\Entity\Publication;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Publication>
 */
class PublicationRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Publication::class);
    }

    public function countForUser(User $owner): int
    {
        return (int) $this->createQueryBuilder('p')
            ->select('COUNT(p.id)')
            ->join('p.campaignObject', 'co')
            ->join('co.campaign', 'c')
            ->andWhere('c.owner = :owner')
            ->setParameter('owner', $owner)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @return array<string, int>
     */
    public function countByPlatformForUser(User $owner): array
    {
        $rows = $this->createQueryBuilder('p')
            ->select('p.platform, COUNT(p.id) AS cnt')
            ->join('p.campaignObject', 'co')
            ->join('co.campaign', 'c')
            ->andWhere('c.owner = :owner')
            ->setParameter('owner', $owner)
            ->groupBy('p.platform')
            ->getQuery()
            ->getScalarResult();

        $result = [];
        foreach ($rows as $row) {
            $result[$row['platform']] = (int) $row['cnt'];
        }

        return $result;
    }

    /**
     * @return array<string, int>
     */
    public function countByStatusForUser(User $owner): array
    {
        $rows = $this->createQueryBuilder('p')
            ->select('p.status, COUNT(p.id) AS cnt')
            ->join('p.campaignObject', 'co')
            ->join('co.campaign', 'c')
            ->andWhere('c.owner = :owner')
            ->setParameter('owner', $owner)
            ->groupBy('p.status')
            ->getQuery()
            ->getScalarResult();

        $result = [];
        foreach ($rows as $row) {
            $result[$row['status']] = (int) $row['cnt'];
        }

        return $result;
    }

    /**
     * @return array<int, array{month: string, count: int}>
     */
    public function monthlyForUser(User $owner, int $months = 6): array
    {
        $since = new \DateTimeImmutable("-{$months} months");

        $rows = $this->getEntityManager()->getConnection()->executeQuery(
            "SELECT TO_CHAR(p.created_at, 'YYYY-MM') AS month, COUNT(p.id) AS cnt
             FROM publication p
             JOIN campaign_object co ON p.campaign_object_id = co.id
             JOIN campaign c ON co.campaign_id = c.id
             WHERE c.owner_id = :owner AND p.created_at >= :since
             GROUP BY month ORDER BY month ASC",
            ['owner' => $owner->getId()->toRfc4122(), 'since' => $since->format('Y-m-d H:i:s')]
        )->fetchAllAssociative();

        return array_map(fn (array $r) => ['month' => $r['month'], 'count' => (int) $r['cnt']], $rows);
    }
}
