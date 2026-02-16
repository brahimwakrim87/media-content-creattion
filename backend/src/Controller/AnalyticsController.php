<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\AuditLogRepository;
use App\Repository\CampaignObjectRepository;
use App\Repository\CampaignRepository;
use App\Repository\GenerationJobRepository;
use App\Repository\PublicationRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class AnalyticsController extends AbstractController
{
    public function __construct(
        private readonly CampaignRepository $campaignRepo,
        private readonly CampaignObjectRepository $contentRepo,
        private readonly PublicationRepository $publicationRepo,
        private readonly GenerationJobRepository $generationRepo,
        private readonly AuditLogRepository $auditLogRepo,
    ) {
    }

    #[Route('/api/analytics/dashboard', name: 'api_analytics_dashboard', methods: ['GET'])]
    public function dashboard(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        /** @var User $user */
        $user = $this->getUser();

        $campaignsByStatus = $this->campaignRepo->countByStatusForUser($user);
        $totalCampaigns = $this->campaignRepo->countByOwner($user);

        $contentByType = $this->contentRepo->countByTypeForUser($user);
        $contentByStatus = $this->contentRepo->countByStatusForUser($user);
        $totalContent = $this->contentRepo->countForUser($user);

        $totalPublications = $this->publicationRepo->countForUser($user);
        $publicationsByPlatform = $this->publicationRepo->countByPlatformForUser($user);
        $publicationsByStatus = $this->publicationRepo->countByStatusForUser($user);

        $generationStats = $this->generationRepo->statsForUser($user);
        $generationsByProvider = $this->generationRepo->countByProviderForUser($user);

        $monthlyContent = $this->contentRepo->monthlyCreatedForUser($user);
        $monthlyPublications = $this->publicationRepo->monthlyForUser($user);
        $monthlyGenerations = $this->generationRepo->monthlyForUser($user);
        $monthlyTrends = $this->mergeMonthlyData($monthlyContent, $monthlyPublications, $monthlyGenerations);

        $topCampaigns = $this->campaignRepo->topCampaignsByContentCount($user);

        $recentLogs = $this->auditLogRepo->recentForUser($user);
        $recentActivity = array_map(fn ($log) => [
            'id' => $log->getId()->toRfc4122(),
            'action' => $log->getAction(),
            'entityType' => $log->getEntityType(),
            'entityId' => $log->getEntityId()?->toRfc4122(),
            'createdAt' => $log->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ], $recentLogs);

        return $this->json([
            'campaigns' => [
                'total' => $totalCampaigns,
                'byStatus' => $campaignsByStatus,
            ],
            'content' => [
                'total' => $totalContent,
                'byType' => $contentByType,
                'byStatus' => $contentByStatus,
            ],
            'publications' => [
                'total' => $totalPublications,
                'byPlatform' => $publicationsByPlatform,
                'byStatus' => $publicationsByStatus,
            ],
            'generations' => [
                'total' => $generationStats['total'],
                'completed' => $generationStats['completed'],
                'failed' => $generationStats['failed'],
                'totalTokens' => $generationStats['totalTokens'],
                'avgProcessingTimeMs' => $generationStats['avgProcessingTimeMs'],
                'byProvider' => $generationsByProvider,
            ],
            'monthlyTrends' => $monthlyTrends,
            'topCampaigns' => $topCampaigns,
            'recentActivity' => $recentActivity,
        ]);
    }

    /**
     * @param array<int, array{month: string, count: int}> $content
     * @param array<int, array{month: string, count: int}> $publications
     * @param array<int, array{month: string, count: int}> $generations
     * @return array<int, array{month: string, content: int, publications: int, generations: int}>
     */
    private function mergeMonthlyData(array $content, array $publications, array $generations): array
    {
        $map = [];

        foreach ($content as $item) {
            $map[$item['month']]['content'] = $item['count'];
        }
        foreach ($publications as $item) {
            $map[$item['month']]['publications'] = $item['count'];
        }
        foreach ($generations as $item) {
            $map[$item['month']]['generations'] = $item['count'];
        }

        ksort($map);

        $result = [];
        foreach ($map as $month => $data) {
            $result[] = [
                'month' => $month,
                'content' => $data['content'] ?? 0,
                'publications' => $data['publications'] ?? 0,
                'generations' => $data['generations'] ?? 0,
            ];
        }

        return $result;
    }
}
