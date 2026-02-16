<?php

namespace App\Controller;

use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class UserSearchController extends AbstractController
{
    public function __construct(
        private readonly UserRepository $userRepo,
    ) {
    }

    #[Route('/api/users/search', methods: ['GET'], priority: 10)]
    public function search(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $q = trim($request->query->get('q', ''));
        if (mb_strlen($q) < 2) {
            return $this->json([]);
        }

        $users = $this->userRepo->searchByEmail($q, 10);

        return $this->json(array_map(fn($u) => [
            'id' => $u->getId()->toRfc4122(),
            'email' => $u->getEmail(),
            'firstName' => $u->getFirstName(),
            'lastName' => $u->getLastName(),
            'avatarUrl' => $u->getAvatarUrl(),
        ], $users));
    }
}
