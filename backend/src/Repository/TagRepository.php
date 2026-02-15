<?php

namespace App\Repository;

use App\Entity\Tag;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Tag>
 */
class TagRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Tag::class);
    }

    /**
     * @return Tag[]
     */
    public function findByNameLike(string $query): array
    {
        return $this->createQueryBuilder('t')
            ->andWhere('LOWER(t.name) LIKE :query')
            ->setParameter('query', '%' . strtolower($query) . '%')
            ->orderBy('t.name', 'ASC')
            ->setMaxResults(20)
            ->getQuery()
            ->getResult();
    }
}
