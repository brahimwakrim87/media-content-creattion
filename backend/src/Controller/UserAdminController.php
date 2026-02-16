<?php

namespace App\Controller;

use App\Entity\Role;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/api/admin')]
class UserAdminController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    #[Route('/roles', methods: ['GET'])]
    public function listRoles(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $roles = $this->em->getRepository(Role::class)->findAll();

        return $this->json(array_map(fn (Role $r) => [
            'id' => $r->getId()->toRfc4122(),
            'name' => $r->getName(),
            'description' => $r->getDescription(),
        ], $roles));
    }

    #[Route('/users/{id}/roles', methods: ['PUT'])]
    public function updateUserRoles(string $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $user = $this->em->getRepository(User::class)->find(Uuid::fromString($id));
        if (!$user) {
            throw $this->createNotFoundException('User not found.');
        }

        $payload = json_decode($request->getContent(), true) ?? [];
        $roleNames = $payload['roles'] ?? null;

        if (!is_array($roleNames)) {
            throw new BadRequestHttpException('Expected {"roles": ["admin", "editor"]}');
        }

        $roleRepo = $this->em->getRepository(Role::class);

        // Clear existing roles
        foreach ($user->getRoleEntities()->toArray() as $existingRole) {
            $user->removeRoleEntity($existingRole);
        }

        // Assign new roles
        foreach ($roleNames as $name) {
            $role = $roleRepo->findOneBy(['name' => $name]);
            if ($role) {
                $user->addRoleEntity($role);
            }
        }

        $this->em->flush();

        return $this->json([
            'id' => $user->getId()->toRfc4122(),
            'roles' => array_map(fn (Role $r) => $r->getName(), $user->getRoleEntities()->toArray()),
        ]);
    }
}
