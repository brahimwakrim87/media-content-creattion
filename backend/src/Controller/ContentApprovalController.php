<?php

namespace App\Controller;

use App\Entity\CampaignObject;
use App\Message\SendNotification;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

class ContentApprovalController extends AbstractController
{
    private const TRANSITIONS = [
        'submit_review' => ['from' => ['draft'], 'to' => 'ready'],
        'approve' => ['from' => ['ready'], 'to' => 'approved'],
        'request_changes' => ['from' => ['ready', 'approved'], 'to' => 'draft'],
    ];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly MessageBusInterface $bus,
    ) {
    }

    #[Route('/api/campaign_objects/{id}/transition', methods: ['POST'], priority: 10)]
    public function transition(string $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $user = $this->getUser();

        $content = $this->em->getRepository(CampaignObject::class)->find(Uuid::fromString($id));
        if (!$content) {
            throw $this->createNotFoundException('Content not found.');
        }

        $owner = $content->getCampaign()?->getOwner();
        if ($owner !== $user && !$this->isGranted('ROLE_ADMIN')) {
            throw $this->createAccessDeniedException();
        }

        $payload = json_decode($request->getContent(), true) ?? [];
        $action = $payload['action'] ?? null;

        if (!$action || !isset(self::TRANSITIONS[$action])) {
            throw new BadRequestHttpException('Invalid action. Valid actions: ' . implode(', ', array_keys(self::TRANSITIONS)));
        }

        $transition = self::TRANSITIONS[$action];
        if (!in_array($content->getStatus(), $transition['from'], true)) {
            throw new BadRequestHttpException(sprintf(
                'Cannot "%s" from status "%s". Allowed from: %s',
                $action,
                $content->getStatus(),
                implode(', ', $transition['from'])
            ));
        }

        $content->setStatus($transition['to']);
        $this->em->flush();

        $notifTitle = match ($action) {
            'submit_review' => 'Content submitted for review',
            'approve' => 'Content approved',
            'request_changes' => 'Changes requested for content',
        };

        $this->bus->dispatch(new SendNotification(
            userId: $owner->getId()->toRfc4122(),
            type: 'content',
            title: $notifTitle,
            message: $payload['comment'] ?? null,
            data: ['contentId' => $id, 'action' => $action],
        ));

        return $this->json([
            'id' => $content->getId()->toRfc4122(),
            'status' => $content->getStatus(),
            'action' => $action,
        ]);
    }
}
