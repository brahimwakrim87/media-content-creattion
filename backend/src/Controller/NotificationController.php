<?php

namespace App\Controller;

use App\Entity\Notification;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mercure\Authorization;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/notifications')]
class NotificationController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly Authorization $authorization,
    ) {
    }

    #[Route('/unread-count', methods: ['GET'], priority: 10)]
    public function unreadCount(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $user = $this->getUser();

        $count = (int) $this->em->getRepository(Notification::class)
            ->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->andWhere('n.user = :user')
            ->andWhere('n.isRead = false')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();

        return $this->json(['count' => $count]);
    }

    #[Route('/mark-all-read', methods: ['PATCH'], priority: 10)]
    public function markAllRead(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $user = $this->getUser();

        $updated = $this->em->createQueryBuilder()
            ->update(Notification::class, 'n')
            ->set('n.isRead', 'true')
            ->set('n.readAt', ':now')
            ->andWhere('n.user = :user')
            ->andWhere('n.isRead = false')
            ->setParameter('user', $user)
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->execute();

        return $this->json(['updated' => $updated]);
    }

    #[Route('/clear-read', methods: ['DELETE'], priority: 10)]
    public function clearRead(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $user = $this->getUser();

        $deleted = $this->em->createQueryBuilder()
            ->delete(Notification::class, 'n')
            ->andWhere('n.user = :user')
            ->andWhere('n.isRead = true')
            ->setParameter('user', $user)
            ->getQuery()
            ->execute();

        return $this->json(['deleted' => $deleted]);
    }

    #[Route('/{id}', methods: ['DELETE'], priority: 5)]
    public function delete(string $id): Response
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $user = $this->getUser();

        $notification = $this->em->getRepository(Notification::class)->find($id);
        if (!$notification || $notification->getUser() !== $user) {
            throw $this->createNotFoundException();
        }

        $this->em->remove($notification);
        $this->em->flush();

        return new Response(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/mercure-auth', methods: ['GET'], priority: 10)]
    public function mercureAuth(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $user = $this->getUser();
        $topic = 'notifications/' . $user->getId()->toRfc4122();

        $cookie = $this->authorization->createCookie($request, [$topic]);
        $response = new JsonResponse(['topic' => $topic]);
        $response->headers->setCookie($cookie);

        return $response;
    }
}
