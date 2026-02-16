<?php

namespace App\Repository;

use App\Entity\GenerationJob;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<GenerationJob>
 */
class GenerationJobRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, GenerationJob::class);
    }

    /**
     * @return array{total: int, completed: int, failed: int, totalTokens: int, avgProcessingTimeMs: float}
     */
    public function statsForUser(User $owner): array
    {
        $row = $this->createQueryBuilder('g')
            ->select(
                'COUNT(g.id) AS total',
                "SUM(CASE WHEN g.status = 'completed' THEN 1 ELSE 0 END) AS completed",
                "SUM(CASE WHEN g.status = 'failed' THEN 1 ELSE 0 END) AS failed",
                'COALESCE(SUM(g.tokensUsed), 0) AS totalTokens',
                'COALESCE(AVG(g.processingTimeMs), 0) AS avgProcessingTimeMs'
            )
            ->andWhere('g.requestedBy = :owner')
            ->setParameter('owner', $owner)
            ->getQuery()
            ->getSingleResult();

        return [
            'total' => (int) $row['total'],
            'completed' => (int) $row['completed'],
            'failed' => (int) $row['failed'],
            'totalTokens' => (int) $row['totalTokens'],
            'avgProcessingTimeMs' => round((float) $row['avgProcessingTimeMs']),
        ];
    }

    /**
     * @return array<string, int>
     */
    public function countByProviderForUser(User $owner): array
    {
        $rows = $this->createQueryBuilder('g')
            ->select('g.provider, COUNT(g.id) AS cnt')
            ->andWhere('g.requestedBy = :owner')
            ->setParameter('owner', $owner)
            ->groupBy('g.provider')
            ->getQuery()
            ->getScalarResult();

        $result = [];
        foreach ($rows as $row) {
            $result[$row['provider']] = (int) $row['cnt'];
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
            "SELECT TO_CHAR(g.created_at, 'YYYY-MM') AS month, COUNT(g.id) AS cnt
             FROM generation_job g
             WHERE g.requested_by_id = :owner AND g.created_at >= :since
             GROUP BY month ORDER BY month ASC",
            ['owner' => $owner->getId()->toRfc4122(), 'since' => $since->format('Y-m-d H:i:s')]
        )->fetchAllAssociative();

        return array_map(fn (array $r) => ['month' => $r['month'], 'count' => (int) $r['cnt']], $rows);
    }
}
