<?php

namespace App\Repository;

use App\Entity\Campaign;
use App\Entity\CampaignMember;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CampaignMember>
 */
class CampaignMemberRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CampaignMember::class);
    }

    /**
     * @return CampaignMember[]
     */
    public function findByCampaign(Campaign $campaign): array
    {
        return $this->createQueryBuilder('cm')
            ->andWhere('cm.campaign = :campaign')
            ->setParameter('campaign', $campaign)
            ->orderBy('cm.joinedAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function findMembership(Campaign $campaign, User $user): ?CampaignMember
    {
        return $this->createQueryBuilder('cm')
            ->andWhere('cm.campaign = :campaign')
            ->andWhere('cm.user = :user')
            ->setParameter('campaign', $campaign)
            ->setParameter('user', $user)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function isMember(Campaign $campaign, User $user): bool
    {
        return $this->findMembership($campaign, $user) !== null;
    }

    public function getMemberRole(Campaign $campaign, User $user): ?string
    {
        $member = $this->findMembership($campaign, $user);
        return $member?->getRole();
    }

    public function countForOwner(User $owner): int
    {
        return (int) $this->createQueryBuilder('cm')
            ->select('COUNT(cm.id)')
            ->join('cm.campaign', 'c')
            ->andWhere('c.owner = :owner')
            ->setParameter('owner', $owner)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
