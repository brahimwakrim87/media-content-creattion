<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use League\Flysystem\FilesystemOperator;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

class ProfileController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly FilesystemOperator $mediaStorage,
    ) {
    }

    #[Route('/api/me', name: 'api_profile_get', methods: ['GET'])]
    public function getProfile(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        /** @var User $user */
        $user = $this->getUser();

        return $this->json($this->serializeUser($user));
    }

    #[Route('/api/me', name: 'api_profile_update', methods: ['PATCH'])]
    public function updateProfile(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json(['error' => 'Invalid JSON payload.'], Response::HTTP_BAD_REQUEST);
        }

        if (isset($data['firstName'])) {
            $user->setFirstName(trim($data['firstName']));
        }
        if (isset($data['lastName'])) {
            $user->setLastName(trim($data['lastName']));
        }

        $this->em->flush();

        return $this->json($this->serializeUser($user));
    }

    #[Route('/api/me/password', name: 'api_profile_password', methods: ['POST'])]
    public function changePassword(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json(['error' => 'Invalid JSON payload.'], Response::HTTP_BAD_REQUEST);
        }

        $currentPassword = $data['currentPassword'] ?? null;
        $newPassword = $data['newPassword'] ?? null;

        if (!$currentPassword || !$newPassword) {
            return $this->json(
                ['error' => 'Both currentPassword and newPassword are required.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        if (!$this->passwordHasher->isPasswordValid($user, $currentPassword)) {
            return $this->json(
                ['error' => 'Current password is incorrect.'],
                Response::HTTP_UNPROCESSABLE_ENTITY,
            );
        }

        if (strlen($newPassword) < 8) {
            return $this->json(
                ['error' => 'New password must be at least 8 characters long.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $user->setPassword($this->passwordHasher->hashPassword($user, $newPassword));
        $this->em->flush();

        return $this->json(['message' => 'Password changed successfully.']);
    }

    #[Route('/api/me/avatar', name: 'api_profile_avatar', methods: ['POST'])]
    public function uploadAvatar(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        /** @var User $user */
        $user = $this->getUser();

        $file = $request->files->get('avatar');
        if (!$file || !$file->isValid()) {
            return $this->json(['error' => 'No valid file provided.'], Response::HTTP_BAD_REQUEST);
        }

        $mimeType = $file->getMimeType();
        if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], true)) {
            return $this->json(
                ['error' => 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        if ($file->getSize() > 5 * 1024 * 1024) {
            return $this->json(
                ['error' => 'File too large. Maximum size is 5MB.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        // Delete old avatar if stored in our media storage
        $oldUrl = $user->getAvatarUrl();
        if ($oldUrl && str_starts_with($oldUrl, '/media/avatars/')) {
            try {
                $this->mediaStorage->delete(substr($oldUrl, strlen('/media/')));
            } catch (\Throwable) {
            }
        }

        $extension = $file->guessExtension() ?? 'jpg';
        $filename = 'avatars/' . Uuid::v4()->toRfc4122() . '.' . $extension;

        $stream = fopen($file->getPathname(), 'r');
        $this->mediaStorage->writeStream($filename, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        $avatarUrl = '/media/' . $filename;
        $user->setAvatarUrl($avatarUrl);
        $this->em->flush();

        return $this->json([
            'avatarUrl' => $avatarUrl,
        ]);
    }

    private function serializeUser(User $user): array
    {
        $roles = $user->getRoleEntities()->map(fn ($r) => [
            'id' => $r->getId()->toRfc4122(),
            'name' => $r->getName(),
        ])->toArray();

        return [
            'id' => $user->getId()->toRfc4122(),
            'email' => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'avatarUrl' => $user->getAvatarUrl(),
            'isActive' => $user->isActive(),
            'emailVerified' => $user->isEmailVerified(),
            'roles' => $user->getRoles(),
            'roleEntities' => array_values($roles),
            'createdAt' => $user->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'updatedAt' => $user->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
