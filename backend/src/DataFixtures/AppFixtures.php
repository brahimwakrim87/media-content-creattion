<?php

namespace App\DataFixtures;

use App\Entity\Permission;
use App\Entity\Role;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        // Create permissions
        $permissionNames = [
            'campaign.create',
            'campaign.edit',
            'campaign.view',
            'campaign.delete',
            'content.create',
            'content.edit',
            'content.view',
            'content.delete',
            'content.submit_review',
            'content.publish',
            'publication.create',
            'publication.view',
            'publication.manage',
            'analytics.view',
            'analytics.export',
            'user.view',
            'user.manage',
            'account.manage',
            'media.upload',
            'ai.generate',
        ];

        $permissions = [];
        foreach ($permissionNames as $name) {
            $permission = new Permission();
            $permission->setName($name);
            $manager->persist($permission);
            $permissions[$name] = $permission;
        }

        // Create roles and assign permissions
        $roleDefinitions = [
            'admin' => [
                'description' => 'Full system administrator',
                'permissions' => $permissionNames, // all permissions
            ],
            'manager' => [
                'description' => 'Campaign and content manager',
                'permissions' => [
                    'campaign.create',
                    'campaign.edit',
                    'campaign.view',
                    'campaign.delete',
                    'content.create',
                    'content.edit',
                    'content.view',
                    'content.delete',
                    'content.submit_review',
                    'content.publish',
                    'publication.create',
                    'publication.view',
                    'publication.manage',
                    'analytics.view',
                    'user.view',
                    'account.manage',
                    'media.upload',
                    'ai.generate',
                ],
            ],
            'editor' => [
                'description' => 'Content editor',
                'permissions' => [
                    'content.create',
                    'content.edit',
                    'content.view',
                    'content.submit_review',
                    'media.upload',
                    'ai.generate',
                ],
            ],
            'viewer' => [
                'description' => 'Read-only viewer',
                'permissions' => [
                    'campaign.view',
                    'content.view',
                    'analytics.view',
                    'publication.view',
                ],
            ],
        ];

        $roles = [];
        foreach ($roleDefinitions as $name => $definition) {
            $role = new Role();
            $role->setName($name);
            $role->setDescription($definition['description']);

            foreach ($definition['permissions'] as $permName) {
                $role->addPermission($permissions[$permName]);
            }

            $manager->persist($role);
            $roles[$name] = $role;
        }

        // Create admin user
        $admin = new User();
        $admin->setEmail('admin@dmcc.local');
        $admin->setFirstName('Admin');
        $admin->setLastName('User');
        $admin->setEmailVerified(true);

        $hashedPassword = $this->passwordHasher->hashPassword($admin, 'Admin123!');
        $admin->setPassword($hashedPassword);
        $admin->addRoleEntity($roles['admin']);

        $manager->persist($admin);

        $manager->flush();
    }
}
