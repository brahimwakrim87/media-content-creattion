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
    public function findForCalendar(User $owner, \DateTimeImmutable $from, \DateTimeImmutable $to): array
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.owner = :owner')
            ->andWhere(
                '(c.startDate <= :to AND c.endDate >= :from) OR ' .
                '(c.startDate BETWEEN :from AND :to) OR ' .
                '(c.endDate BETWEEN :from AND :to)'
            )
            ->setParameter('owner', $owner)
            ->setParameter('from', $from)
            ->setParameter('to', $to)
            ->orderBy('c.startDate', 'ASC')
            ->getQuery()
            ->getResult();
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

    /**
     * @return array<string, int>
     */
    public function countByStatusForUser(User $owner, ?\DateTimeImmutable $since = null): array
    {
        $qb = $this->createQueryBuilder('c')
            ->select('c.status, COUNT(c.id) AS cnt')
            ->andWhere('c.owner = :owner')
            ->setParameter('owner', $owner)
            ->groupBy('c.status');

        if ($since) {
            $qb->andWhere('c.createdAt >= :since')->setParameter('since', $since);
        }

        $rows = $qb->getQuery()->getScalarResult();

        $result = [];
        foreach ($rows as $row) {
            $result[$row['status']] = (int) $row['cnt'];
        }

        return $result;
    }

    /**
     * @return array<int, array{id: string, name: string, status: string, contentCount: int}>
     */
    public function topCampaignsByContentCount(User $owner, int $limit = 5): array
    {
        $rows = $this->createQueryBuilder('c')
            ->select('c.id, c.name, c.status, COUNT(co.id) AS contentCount')
            ->leftJoin('c.campaignObjects', 'co')
            ->andWhere('c.owner = :owner')
            ->setParameter('owner', $owner)
            ->groupBy('c.id, c.name, c.status')
            ->orderBy('contentCount', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        return array_map(fn (array $row) => [
            'id' => (string) $row['id'],
            'name' => $row['name'],
            'status' => $row['status'],
            'contentCount' => (int) $row['contentCount'],
        ], $rows);
    }
}
