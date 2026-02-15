<?php

namespace App\Repository;

use App\Entity\UserSocialAuth;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<UserSocialAuth>
 */
class UserSocialAuthRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserSocialAuth::class);
    }

    public function findByProviderAndId(string $provider, string $providerUserId): ?UserSocialAuth
    {
        return $this->createQueryBuilder('usa')
            ->andWhere('usa.provider = :provider')
            ->andWhere('usa.providerUserId = :providerUserId')
            ->setParameter('provider', $provider)
            ->setParameter('providerUserId', $providerUserId)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
