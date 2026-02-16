<?php

namespace App\Controller;

use App\Entity\Campaign;
use App\Entity\CampaignObject;
use App\Entity\Publication;
use App\Entity\User;
use App\Repository\CampaignObjectRepository;
use App\Repository\CampaignRepository;
use App\Repository\PublicationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Attribute\Route;

class AdvancedController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly CampaignRepository $campaignRepo,
        private readonly CampaignObjectRepository $contentRepo,
        private readonly PublicationRepository $publicationRepo,
    ) {
    }

    /**
     * Pending approvals — content items in "ready" status across accessible campaigns.
     */
    #[Route('/api/approvals', name: 'api_approvals', methods: ['GET'])]
    public function approvals(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        /** @var User $user */
        $user = $this->getUser();

        $qb = $this->em->createQueryBuilder()
            ->select('co', 'c')
            ->from(CampaignObject::class, 'co')
            ->join('co.campaign', 'c')
            ->leftJoin('c.members', 'cm')
            ->where('co.status = :status')
            ->andWhere('c.owner = :user OR (cm.user = :user AND cm.role = :editorRole)')
            ->setParameter('status', 'ready')
            ->setParameter('user', $user)
            ->setParameter('editorRole', 'editor')
            ->orderBy('co.updatedAt', 'DESC');

        $items = $qb->getQuery()->getResult();

        $result = [];
        foreach ($items as $item) {
            $campaign = $item->getCampaign();
            $result[] = [
                'id' => $item->getId()->toRfc4122(),
                'title' => $item->getTitle(),
                'type' => $item->getType(),
                'status' => $item->getStatus(),
                'campaign' => [
                    'id' => $campaign->getId()->toRfc4122(),
                    'name' => $campaign->getName(),
                ],
                'content' => $item->getContent() ? mb_substr($item->getContent(), 0, 200) : null,
                'mediaUrl' => $item->getMediaUrl(),
                'createdAt' => $item->getCreatedAt()->format(\DateTimeInterface::ATOM),
                'updatedAt' => $item->getUpdatedAt()->format(\DateTimeInterface::ATOM),
            ];
        }

        return $this->json($result);
    }

    /**
     * Bulk status transition for content items.
     */
    #[Route('/api/content/bulk-action', name: 'api_content_bulk_action', methods: ['POST'])]
    public function bulkAction(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        $ids = $data['ids'] ?? [];
        $action = $data['action'] ?? null;

        if (empty($ids) || !$action) {
            return $this->json(['error' => 'ids and action are required.'], Response::HTTP_BAD_REQUEST);
        }

        $validActions = ['approve', 'submit_review', 'request_changes', 'delete'];
        if (!in_array($action, $validActions, true)) {
            return $this->json(['error' => 'Invalid action.'], Response::HTTP_BAD_REQUEST);
        }

        $processed = 0;
        $errors = [];

        foreach ($ids as $id) {
            $item = $this->em->getRepository(CampaignObject::class)->find($id);
            if (!$item) {
                $errors[] = "$id: not found";
                continue;
            }

            $campaign = $item->getCampaign();
            if (!$campaign->canEdit($user) && !$this->isGranted('ROLE_ADMIN')) {
                $errors[] = "$id: access denied";
                continue;
            }

            if ($action === 'delete') {
                $this->em->remove($item);
                $processed++;
                continue;
            }

            $transitions = [
                'submit_review' => ['from' => ['draft'], 'to' => 'ready'],
                'approve' => ['from' => ['ready'], 'to' => 'approved'],
                'request_changes' => ['from' => ['ready', 'approved'], 'to' => 'draft'],
            ];

            $t = $transitions[$action];
            if (!in_array($item->getStatus(), $t['from'], true)) {
                $errors[] = "$id: cannot {$action} from status {$item->getStatus()}";
                continue;
            }

            $item->setStatus($t['to']);
            $processed++;
        }

        $this->em->flush();

        return $this->json([
            'processed' => $processed,
            'errors' => $errors,
        ]);
    }

    /**
     * Global search across campaigns, content, and publications.
     */
    #[Route('/api/search', name: 'api_search', methods: ['GET'])]
    public function search(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        /** @var User $user */
        $user = $this->getUser();
        $query = trim($request->query->get('q', ''));

        if (strlen($query) < 2) {
            return $this->json(['campaigns' => [], 'content' => [], 'publications' => []]);
        }

        $like = '%' . $query . '%';

        // Search campaigns
        $campaigns = $this->em->createQueryBuilder()
            ->select('c')
            ->from(Campaign::class, 'c')
            ->leftJoin('c.members', 'cm')
            ->where('(c.owner = :user OR cm.user = :user)')
            ->andWhere('LOWER(c.name) LIKE LOWER(:q) OR LOWER(c.description) LIKE LOWER(:q)')
            ->setParameter('user', $user)
            ->setParameter('q', $like)
            ->setMaxResults(5)
            ->getQuery()
            ->getResult();

        $campaignResults = array_map(fn(Campaign $c) => [
            'id' => $c->getId()->toRfc4122(),
            'name' => $c->getName(),
            'status' => $c->getStatus(),
            'type' => 'campaign',
        ], $campaigns);

        // Search content
        $content = $this->em->createQueryBuilder()
            ->select('co')
            ->from(CampaignObject::class, 'co')
            ->join('co.campaign', 'c2')
            ->leftJoin('c2.members', 'cm2')
            ->where('(c2.owner = :user OR cm2.user = :user)')
            ->andWhere('LOWER(co.title) LIKE LOWER(:q) OR LOWER(co.content) LIKE LOWER(:q)')
            ->setParameter('user', $user)
            ->setParameter('q', $like)
            ->setMaxResults(5)
            ->getQuery()
            ->getResult();

        $contentResults = array_map(fn(CampaignObject $co) => [
            'id' => $co->getId()->toRfc4122(),
            'title' => $co->getTitle() ?? 'Untitled ' . $co->getType(),
            'status' => $co->getStatus(),
            'campaignName' => $co->getCampaign()->getName(),
            'type' => 'content',
        ], $content);

        // Search publications
        $pubs = $this->em->createQueryBuilder()
            ->select('p')
            ->from(Publication::class, 'p')
            ->join('p.campaignObject', 'pco')
            ->join('pco.campaign', 'pc')
            ->leftJoin('pc.members', 'pcm')
            ->where('(pc.owner = :user OR pcm.user = :user)')
            ->andWhere('LOWER(p.platform) LIKE LOWER(:q)')
            ->setParameter('user', $user)
            ->setParameter('q', $like)
            ->setMaxResults(5)
            ->getQuery()
            ->getResult();

        $pubResults = array_map(fn(Publication $p) => [
            'id' => $p->getId()->toRfc4122(),
            'platform' => $p->getPlatform(),
            'status' => $p->getStatus(),
            'title' => $p->getCampaignObject()->getTitle() ?? 'Untitled',
            'type' => 'publication',
        ], $pubs);

        return $this->json([
            'campaigns' => $campaignResults,
            'content' => $contentResults,
            'publications' => $pubResults,
        ]);
    }

    /**
     * Export campaigns as CSV.
     */
    #[Route('/api/campaigns/export', name: 'api_campaigns_export', methods: ['GET'])]
    public function exportCampaigns(): StreamedResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        /** @var User $user */
        $user = $this->getUser();

        $campaigns = $this->em->createQueryBuilder()
            ->select('c')
            ->from(Campaign::class, 'c')
            ->leftJoin('c.members', 'cm')
            ->where('c.owner = :user OR cm.user = :user')
            ->setParameter('user', $user)
            ->orderBy('c.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        $response = new StreamedResponse(function () use ($campaigns) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Name', 'Status', 'Budget', 'Start Date', 'End Date', 'Content Count', 'Created At']);

            foreach ($campaigns as $c) {
                fputcsv($handle, [
                    $c->getName(),
                    $c->getStatus(),
                    $c->getBudget() ?? '',
                    $c->getStartDate()?->format('Y-m-d') ?? '',
                    $c->getEndDate()?->format('Y-m-d') ?? '',
                    $c->getCampaignObjects()->count(),
                    $c->getCreatedAt()->format('Y-m-d H:i'),
                ]);
            }

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv');
        $response->headers->set('Content-Disposition', 'attachment; filename="campaigns.csv"');

        return $response;
    }

    /**
     * Export content as CSV.
     */
    #[Route('/api/content/export', name: 'api_content_export', methods: ['GET'])]
    public function exportContent(): StreamedResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        /** @var User $user */
        $user = $this->getUser();

        $content = $this->em->createQueryBuilder()
            ->select('co', 'c')
            ->from(CampaignObject::class, 'co')
            ->join('co.campaign', 'c')
            ->leftJoin('c.members', 'cm')
            ->where('c.owner = :user OR cm.user = :user')
            ->setParameter('user', $user)
            ->orderBy('co.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        $response = new StreamedResponse(function () use ($content) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Title', 'Type', 'Status', 'Campaign', 'Content Preview', 'Media URL', 'Created At']);

            foreach ($content as $co) {
                fputcsv($handle, [
                    $co->getTitle() ?? 'Untitled',
                    $co->getType(),
                    $co->getStatus(),
                    $co->getCampaign()->getName(),
                    mb_substr($co->getContent() ?? '', 0, 100),
                    $co->getMediaUrl() ?? '',
                    $co->getCreatedAt()->format('Y-m-d H:i'),
                ]);
            }

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv');
        $response->headers->set('Content-Disposition', 'attachment; filename="content.csv"');

        return $response;
    }
}
