<?php

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Campaign;
use App\Entity\CampaignMember;
use App\Entity\CampaignObject;
use App\Entity\CampaignTarget;
use App\Entity\GenerationJob;
use App\Entity\MediaAsset;
use App\Entity\Notification;
use App\Entity\Publication;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

final class CurrentUserExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    public function __construct(
        private readonly Security $security,
    ) {
    }

    public function applyToCollection(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        ?Operation $operation = null,
        array $context = [],
    ): void {
        $this->addWhere($queryBuilder, $resourceClass);
    }

    public function applyToItem(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        array $identifiers,
        ?Operation $operation = null,
        array $context = [],
    ): void {
        $this->addWhere($queryBuilder, $resourceClass);
    }

    private function addWhere(QueryBuilder $queryBuilder, string $resourceClass): void
    {
        $user = $this->security->getUser();
        if (!$user) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0];

        if ($resourceClass === Campaign::class) {
            $queryBuilder
                ->leftJoin(CampaignMember::class, 'cue_cm', 'WITH', sprintf('cue_cm.campaign = %s.id AND cue_cm.user = :current_user', $rootAlias))
                ->andWhere(sprintf('%s.owner = :current_user OR cue_cm.id IS NOT NULL', $rootAlias))
                ->setParameter('current_user', $user);
        }

        if ($resourceClass === CampaignObject::class) {
            $queryBuilder->join(sprintf('%s.campaign', $rootAlias), 'cue_co_campaign')
                ->leftJoin(CampaignMember::class, 'cue_co_cm', 'WITH', 'cue_co_cm.campaign = cue_co_campaign.id AND cue_co_cm.user = :current_user')
                ->andWhere('cue_co_campaign.owner = :current_user OR cue_co_cm.id IS NOT NULL')
                ->setParameter('current_user', $user);
        }

        if ($resourceClass === CampaignTarget::class) {
            $queryBuilder->join(sprintf('%s.campaign', $rootAlias), 'cue_ct_campaign')
                ->leftJoin(CampaignMember::class, 'cue_ct_cm', 'WITH', 'cue_ct_cm.campaign = cue_ct_campaign.id AND cue_ct_cm.user = :current_user')
                ->andWhere('cue_ct_campaign.owner = :current_user OR cue_ct_cm.id IS NOT NULL')
                ->setParameter('current_user', $user);
        }

        if ($resourceClass === Publication::class) {
            $queryBuilder->join(sprintf('%s.campaignObject', $rootAlias), 'cue_pub_content')
                ->join('cue_pub_content.campaign', 'cue_pub_campaign')
                ->leftJoin(CampaignMember::class, 'cue_pub_cm', 'WITH', 'cue_pub_cm.campaign = cue_pub_campaign.id AND cue_pub_cm.user = :current_user')
                ->andWhere('cue_pub_campaign.owner = :current_user OR cue_pub_cm.id IS NOT NULL')
                ->setParameter('current_user', $user);
        }

        if ($resourceClass === CampaignMember::class) {
            $queryBuilder->join(sprintf('%s.campaign', $rootAlias), 'cue_mem_campaign')
                ->leftJoin(CampaignMember::class, 'cue_mem_cm', 'WITH', 'cue_mem_cm.campaign = cue_mem_campaign.id AND cue_mem_cm.user = :current_user')
                ->andWhere('cue_mem_campaign.owner = :current_user OR cue_mem_cm.id IS NOT NULL')
                ->setParameter('current_user', $user);
        }

        if ($resourceClass === GenerationJob::class) {
            $queryBuilder->andWhere(sprintf('%s.requestedBy = :current_user', $rootAlias))
                ->setParameter('current_user', $user);
        }

        if ($resourceClass === Notification::class) {
            $queryBuilder->andWhere(sprintf('%s.user = :current_user', $rootAlias))
                ->setParameter('current_user', $user);
        }

        if ($resourceClass === MediaAsset::class) {
            $queryBuilder->andWhere(sprintf('%s.uploadedBy = :current_user', $rootAlias))
                ->setParameter('current_user', $user);
        }
    }
}
