<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\CampaignRepository;
use App\Repository\PublicationRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class CalendarController extends AbstractController
{
    public function __construct(
        private readonly PublicationRepository $publicationRepo,
        private readonly CampaignRepository $campaignRepo,
    ) {
    }

    #[Route('/api/publications/calendar', methods: ['GET'], priority: 10)]
    public function publicationsCalendar(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        /** @var User $user */
        $user = $this->getUser();

        $from = $request->query->get('from');
        $to = $request->query->get('to');

        if (!$from || !$to) {
            return $this->json(['error' => 'from and to query parameters are required'], 400);
        }

        $fromDate = new \DateTimeImmutable($from . ' 00:00:00');
        $toDate = new \DateTimeImmutable($to . ' 23:59:59');

        $publications = $this->publicationRepo->findForCalendar($user, $fromDate, $toDate);

        $result = array_map(fn ($pub) => [
            'id' => $pub->getId()->toRfc4122(),
            'platform' => $pub->getPlatform(),
            'status' => $pub->getStatus(),
            'scheduledAt' => $pub->getScheduledAt()?->format(\DateTimeInterface::ATOM),
            'publishedAt' => $pub->getPublishedAt()?->format(\DateTimeInterface::ATOM),
            'campaignObject' => [
                'id' => $pub->getCampaignObject()->getId()->toRfc4122(),
                'title' => $pub->getCampaignObject()->getTitle(),
                'type' => $pub->getCampaignObject()->getType(),
            ],
            'socialAccount' => [
                'id' => $pub->getSocialAccount()->getId()->toRfc4122(),
                'platform' => $pub->getSocialAccount()->getPlatform(),
                'accountName' => $pub->getSocialAccount()->getAccountName(),
            ],
        ], $publications);

        return $this->json($result);
    }

    #[Route('/api/campaigns/calendar', methods: ['GET'], priority: 10)]
    public function campaignsCalendar(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        /** @var User $user */
        $user = $this->getUser();

        $from = $request->query->get('from');
        $to = $request->query->get('to');

        if (!$from || !$to) {
            return $this->json(['error' => 'from and to query parameters are required'], 400);
        }

        $fromDate = new \DateTimeImmutable($from);
        $toDate = new \DateTimeImmutable($to);

        $campaigns = $this->campaignRepo->findForCalendar($user, $fromDate, $toDate);

        $result = array_map(fn ($c) => [
            'id' => $c->getId()->toRfc4122(),
            'name' => $c->getName(),
            'status' => $c->getStatus(),
            'startDate' => $c->getStartDate()?->format('Y-m-d'),
            'endDate' => $c->getEndDate()?->format('Y-m-d'),
        ], $campaigns);

        return $this->json($result);
    }
}
