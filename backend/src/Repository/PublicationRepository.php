<?php

namespace App\Repository;

use App\Entity\Campaign;
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

    /**
     * @return Publication[]
     */
    public function findForCalendar(User $owner, \DateTimeImmutable $from, \DateTimeImmutable $to, int $limit = 200): array
    {
        return $this->createQueryBuilder('p')
            ->join('p.campaignObject', 'co')
            ->join('co.campaign', 'c')
            ->andWhere('c.owner = :owner')
            ->andWhere(
                '(p.scheduledAt BETWEEN :from AND :to) OR (p.publishedAt BETWEEN :from AND :to)'
            )
            ->setParameter('owner', $owner)
            ->setParameter('from', $from)
            ->setParameter('to', $to)
            ->orderBy('p.scheduledAt', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Publication[]
     */
    public function findDueForPublishing(int $limit = 50): array
    {
        return $this->createQueryBuilder('p')
            ->andWhere('p.status = :status')
            ->andWhere('p.scheduledAt <= :now')
            ->setParameter('status', 'scheduled')
            ->setParameter('now', new \DateTimeImmutable())
            ->orderBy('p.scheduledAt', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function countForUser(User $owner, ?\DateTimeImmutable $since = null): int
    {
        $qb = $this->createQueryBuilder('p')
            ->select('COUNT(p.id)')
            ->join('p.campaignObject', 'co')
            ->join('co.campaign', 'c')
            ->andWhere('c.owner = :owner')
            ->setParameter('owner', $owner);

        if ($since) {
            $qb->andWhere('p.createdAt >= :since')->setParameter('since', $since);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    /**
     * @return array<string, int>
     */
    public function countByPlatformForUser(User $owner, ?\DateTimeImmutable $since = null): array
    {
        $qb = $this->createQueryBuilder('p')
            ->select('p.platform, COUNT(p.id) AS cnt')
            ->join('p.campaignObject', 'co')
            ->join('co.campaign', 'c')
            ->andWhere('c.owner = :owner')
            ->setParameter('owner', $owner)
            ->groupBy('p.platform');

        if ($since) {
            $qb->andWhere('p.createdAt >= :since')->setParameter('since', $since);
        }

        $rows = $qb->getQuery()->getScalarResult();

        $result = [];
        foreach ($rows as $row) {
            $result[$row['platform']] = (int) $row['cnt'];
        }

        return $result;
    }

    /**
     * @return array<string, int>
     */
    public function countByStatusForUser(User $owner, ?\DateTimeImmutable $since = null): array
    {
        $qb = $this->createQueryBuilder('p')
            ->select('p.status, COUNT(p.id) AS cnt')
            ->join('p.campaignObject', 'co')
            ->join('co.campaign', 'c')
            ->andWhere('c.owner = :owner')
            ->setParameter('owner', $owner)
            ->groupBy('p.status');

        if ($since) {
            $qb->andWhere('p.createdAt >= :since')->setParameter('since', $since);
        }

        $rows = $qb->getQuery()->getScalarResult();

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

    /**
     * @return array<string, int>
     */
    public function countByPlatformForCampaign(Campaign $campaign): array
    {
        $rows = $this->createQueryBuilder('p')
            ->select('p.platform, COUNT(p.id) AS cnt')
            ->join('p.campaignObject', 'co')
            ->andWhere('co.campaign = :campaign')
            ->setParameter('campaign', $campaign)
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
    public function countByStatusForCampaign(Campaign $campaign): array
    {
        $rows = $this->createQueryBuilder('p')
            ->select('p.status, COUNT(p.id) AS cnt')
            ->join('p.campaignObject', 'co')
            ->andWhere('co.campaign = :campaign')
            ->setParameter('campaign', $campaign)
            ->groupBy('p.status')
            ->getQuery()
            ->getScalarResult();

        $result = [];
        foreach ($rows as $row) {
            $result[$row['status']] = (int) $row['cnt'];
        }

        return $result;
    }
}
