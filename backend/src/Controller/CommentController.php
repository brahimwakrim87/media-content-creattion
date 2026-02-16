<?php

namespace App\Controller;

use App\Entity\Campaign;
use App\Entity\CampaignObject;
use App\Repository\CommentRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

class CommentController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly CommentRepository $commentRepo,
    ) {
    }

    #[Route('/api/entities/{entityType}/{entityId}/comments', methods: ['GET'], priority: 10)]
    public function list(string $entityType, string $entityId): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $user = $this->getUser();

        if (!in_array($entityType, ['Campaign', 'CampaignObject'], true)) {
            throw $this->createNotFoundException('Invalid entity type.');
        }

        $uuid = Uuid::fromString($entityId);

        // Verify access
        if ($entityType === 'Campaign') {
            $campaign = $this->em->getRepository(Campaign::class)->find($uuid);
            if (!$campaign || !$campaign->hasAccess($user)) {
                throw $this->createAccessDeniedException();
            }
        } else {
            $obj = $this->em->getRepository(CampaignObject::class)->find($uuid);
            if (!$obj || !$obj->getCampaign()->hasAccess($user)) {
                throw $this->createAccessDeniedException();
            }
        }

        $comments = $this->commentRepo->findByEntity($entityType, $uuid);

        $result = array_map(fn($c) => $this->serializeComment($c), $comments);

        return $this->json($result);
    }

    private function serializeComment(object $comment): array
    {
        $author = $comment->getAuthor();
        $data = [
            'id' => $comment->getId()->toRfc4122(),
            'entityType' => $comment->getEntityType(),
            'entityId' => $comment->getEntityId()->toRfc4122(),
            'author' => [
                'id' => $author->getId()->toRfc4122(),
                'email' => $author->getEmail(),
                'firstName' => $author->getFirstName(),
                'lastName' => $author->getLastName(),
                'avatarUrl' => $author->getAvatarUrl(),
            ],
            'body' => $comment->getBody(),
            'mentions' => $comment->getMentions(),
            'createdAt' => $comment->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'updatedAt' => $comment->getUpdatedAt()->format(\DateTimeInterface::ATOM),
            'replies' => [],
        ];

        foreach ($comment->getReplies() as $reply) {
            $replyAuthor = $reply->getAuthor();
            $data['replies'][] = [
                'id' => $reply->getId()->toRfc4122(),
                'author' => [
                    'id' => $replyAuthor->getId()->toRfc4122(),
                    'email' => $replyAuthor->getEmail(),
                    'firstName' => $replyAuthor->getFirstName(),
                    'lastName' => $replyAuthor->getLastName(),
                    'avatarUrl' => $replyAuthor->getAvatarUrl(),
                ],
                'body' => $reply->getBody(),
                'mentions' => $reply->getMentions(),
                'createdAt' => $reply->getCreatedAt()->format(\DateTimeInterface::ATOM),
                'updatedAt' => $reply->getUpdatedAt()->format(\DateTimeInterface::ATOM),
            ];
        }

        return $data;
    }
}
