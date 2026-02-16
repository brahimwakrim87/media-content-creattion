<?php

namespace App\Controller;

use App\Entity\Campaign;
use App\Entity\User;
use App\Repository\AuditLogRepository;
use App\Repository\CampaignMemberRepository;
use App\Repository\CampaignObjectRepository;
use App\Repository\CampaignRepository;
use App\Repository\CommentRepository;
use App\Repository\GenerationJobRepository;
use App\Repository\PublicationRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class AnalyticsController extends AbstractController
{
    public function __construct(
        private readonly CampaignRepository $campaignRepo,
        private readonly CampaignObjectRepository $contentRepo,
        private readonly PublicationRepository $publicationRepo,
        private readonly GenerationJobRepository $generationRepo,
        private readonly AuditLogRepository $auditLogRepo,
        private readonly CampaignMemberRepository $memberRepo,
        private readonly CommentRepository $commentRepo,
    ) {
    }

    #[Route('/api/analytics/dashboard', name: 'api_analytics_dashboard', methods: ['GET'])]
    public function dashboard(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        /** @var User $user */
        $user = $this->getUser();

        $period = $request->query->get('period', 'all');
        $since = $this->periodToDate($period);

        $campaignsByStatus = $this->campaignRepo->countByStatusForUser($user, $since);
        $totalCampaigns = array_sum($campaignsByStatus) ?: $this->campaignRepo->countByOwner($user);

        $contentByType = $this->contentRepo->countByTypeForUser($user, $since);
        $contentByStatus = $this->contentRepo->countByStatusForUser($user, $since);
        $totalContent = array_sum($contentByStatus) ?: $this->contentRepo->countForUser($user);

        $totalPublications = $this->publicationRepo->countForUser($user, $since);
        $publicationsByPlatform = $this->publicationRepo->countByPlatformForUser($user, $since);
        $publicationsByStatus = $this->publicationRepo->countByStatusForUser($user, $since);

        $generationStats = $this->generationRepo->statsForUser($user, $since);
        $generationsByProvider = $this->generationRepo->countByProviderForUser($user, $since);

        $months = match ($period) {
            '7d', '30d' => 2,
            '90d' => 4,
            default => 6,
        };
        $monthlyContent = $this->contentRepo->monthlyCreatedForUser($user, $months);
        $monthlyPublications = $this->publicationRepo->monthlyForUser($user, $months);
        $monthlyGenerations = $this->generationRepo->monthlyForUser($user, $months);
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

        // Content pipeline: ordered status counts
        $pipeline = [];
        foreach (['draft', 'generating', 'ready', 'approved', 'published'] as $status) {
            $pipeline[] = [
                'status' => $status,
                'count' => $contentByStatus[$status] ?? 0,
            ];
        }

        // Team stats
        $teamMemberCount = $this->memberRepo->countForOwner($user);
        $totalComments = $this->commentRepo->countForOwner($user);

        return $this->json([
            'campaigns' => [
                'total' => $totalCampaigns,
                'byStatus' => $campaignsByStatus,
            ],
            'content' => [
                'total' => $totalContent,
                'byType' => $contentByType,
                'byStatus' => $contentByStatus,
                'pipeline' => $pipeline,
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
            'team' => [
                'members' => $teamMemberCount,
                'comments' => $totalComments,
            ],
            'monthlyTrends' => $monthlyTrends,
            'topCampaigns' => $topCampaigns,
            'recentActivity' => $recentActivity,
        ]);
    }

    #[Route('/api/analytics/campaigns/{id}', name: 'api_analytics_campaign', methods: ['GET'], priority: 10)]
    public function campaignDetail(Campaign $campaign): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        /** @var User $user */
        $user = $this->getUser();

        if (!$campaign->hasAccess($user)) {
            throw $this->createAccessDeniedException();
        }

        $contentByType = $this->contentRepo->countByTypeForCampaign($campaign);
        $contentByStatus = $this->contentRepo->countByStatusForCampaign($campaign);
        $publicationsByPlatform = $this->publicationRepo->countByPlatformForCampaign($campaign);
        $publicationsByStatus = $this->publicationRepo->countByStatusForCampaign($campaign);
        $generationStats = $this->generationRepo->statsForCampaign($campaign);

        $pipeline = [];
        foreach (['draft', 'generating', 'ready', 'approved', 'published'] as $status) {
            $pipeline[] = [
                'status' => $status,
                'count' => $contentByStatus[$status] ?? 0,
            ];
        }

        $members = $this->memberRepo->findByCampaign($campaign);
        $teamMembers = array_map(fn ($m) => [
            'id' => $m->getUser()->getId()->toRfc4122(),
            'name' => trim($m->getUser()->getFirstName() . ' ' . $m->getUser()->getLastName()),
            'email' => $m->getUser()->getEmail(),
            'role' => $m->getRole(),
        ], $members);

        return $this->json([
            'campaign' => [
                'id' => $campaign->getId()->toRfc4122(),
                'name' => $campaign->getName(),
                'status' => $campaign->getStatus(),
            ],
            'content' => [
                'total' => array_sum($contentByStatus),
                'byType' => $contentByType,
                'byStatus' => $contentByStatus,
                'pipeline' => $pipeline,
            ],
            'publications' => [
                'total' => array_sum($publicationsByStatus),
                'byPlatform' => $publicationsByPlatform,
                'byStatus' => $publicationsByStatus,
            ],
            'generations' => $generationStats,
            'team' => $teamMembers,
        ]);
    }

    private function periodToDate(string $period): ?\DateTimeImmutable
    {
        return match ($period) {
            '7d' => new \DateTimeImmutable('-7 days'),
            '30d' => new \DateTimeImmutable('-30 days'),
            '90d' => new \DateTimeImmutable('-90 days'),
            '12m' => new \DateTimeImmutable('-12 months'),
            default => null,
        };
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
