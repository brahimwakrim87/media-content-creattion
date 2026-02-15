<?php

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Campaign;
use App\Entity\CampaignObject;
use App\Entity\CampaignTarget;
use App\Entity\GenerationJob;
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
            $queryBuilder->andWhere(sprintf('%s.owner = :current_user', $rootAlias))
                ->setParameter('current_user', $user);
        }

        if ($resourceClass === CampaignObject::class) {
            $queryBuilder->join(sprintf('%s.campaign', $rootAlias), 'campaign_owner_filter')
                ->andWhere('campaign_owner_filter.owner = :current_user')
                ->setParameter('current_user', $user);
        }

        if ($resourceClass === CampaignTarget::class) {
            $queryBuilder->join(sprintf('%s.campaign', $rootAlias), 'ct_campaign')
                ->andWhere('ct_campaign.owner = :current_user')
                ->setParameter('current_user', $user);
        }

        if ($resourceClass === Publication::class) {
            $queryBuilder->join(sprintf('%s.campaignObject', $rootAlias), 'pub_content')
                ->join('pub_content.campaign', 'pub_campaign')
                ->andWhere('pub_campaign.owner = :current_user')
                ->setParameter('current_user', $user);
        }

        if ($resourceClass === GenerationJob::class) {
            $queryBuilder->andWhere(sprintf('%s.requestedBy = :current_user', $rootAlias))
                ->setParameter('current_user', $user);
        }
    }
}
