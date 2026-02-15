<?php

namespace App\DataFixtures;

use App\Entity\Campaign;
use App\Entity\CampaignObject;
use App\Entity\Permission;
use App\Entity\Role;
use App\Entity\Tag;
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

        // Create tags
        $tagDefinitions = [
            ['name' => 'Social Media', 'color' => '#3B82F6'],
            ['name' => 'Product Launch', 'color' => '#10B981'],
            ['name' => 'SEO', 'color' => '#F59E0B'],
            ['name' => 'Video Marketing', 'color' => '#8B5CF6'],
            ['name' => 'Brand', 'color' => '#EF4444'],
        ];

        $tags = [];
        foreach ($tagDefinitions as $def) {
            $tag = new Tag();
            $tag->setName($def['name']);
            $tag->setColor($def['color']);
            $manager->persist($tag);
            $tags[$def['name']] = $tag;
        }

        // Create campaigns for admin
        $campaign1 = new Campaign();
        $campaign1->setName('Product X Launch');
        $campaign1->setDescription('Multi-channel launch campaign for Product X targeting tech-savvy audiences.');
        $campaign1->setOwner($admin);
        $campaign1->setStatus('active');
        $campaign1->setBudget('5000.00');
        $campaign1->setStartDate(new \DateTimeImmutable('2026-02-01'));
        $campaign1->setEndDate(new \DateTimeImmutable('2026-03-31'));
        $campaign1->setGoals(['reach' => 50000, 'conversions' => 500]);
        $campaign1->addTag($tags['Product Launch']);
        $campaign1->addTag($tags['Social Media']);
        $manager->persist($campaign1);

        $campaign2 = new Campaign();
        $campaign2->setName('Q1 Brand Awareness');
        $campaign2->setDescription('Ongoing brand visibility campaign across social platforms.');
        $campaign2->setOwner($admin);
        $campaign2->setStatus('draft');
        $campaign2->setBudget('2500.00');
        $campaign2->setStartDate(new \DateTimeImmutable('2026-03-01'));
        $campaign2->addTag($tags['Brand']);
        $campaign2->addTag($tags['Social Media']);
        $manager->persist($campaign2);

        $campaign3 = new Campaign();
        $campaign3->setName('Holiday Campaign 2025');
        $campaign3->setDescription('End-of-year holiday promotional campaign.');
        $campaign3->setOwner($admin);
        $campaign3->setStatus('completed');
        $campaign3->setBudget('8000.00');
        $campaign3->setStartDate(new \DateTimeImmutable('2025-11-15'));
        $campaign3->setEndDate(new \DateTimeImmutable('2025-12-31'));
        $campaign3->addTag($tags['Brand']);
        $campaign3->addTag($tags['Video Marketing']);
        $manager->persist($campaign3);

        // Create campaign objects (content items)
        $obj1 = new CampaignObject();
        $obj1->setCampaign($campaign1);
        $obj1->setType('video');
        $obj1->setTitle('Product X Teaser Video');
        $obj1->setContent('30-second teaser video showcasing Product X key features.');
        $obj1->setStatus('approved');
        $obj1->addTag($tags['Video Marketing']);
        $obj1->addTag($tags['Product Launch']);
        $manager->persist($obj1);

        $obj2 = new CampaignObject();
        $obj2->setCampaign($campaign1);
        $obj2->setType('post');
        $obj2->setTitle('Launch Day Announcement');
        $obj2->setContent('Exciting news! Product X is officially here. Discover the future of innovation. #ProductX #Innovation');
        $obj2->setStatus('ready');
        $obj2->addTag($tags['Social Media']);
        $manager->persist($obj2);

        $obj3 = new CampaignObject();
        $obj3->setCampaign($campaign1);
        $obj3->setType('image');
        $obj3->setTitle('Product X Hero Banner');
        $obj3->setContent('High-resolution hero banner for social media and website.');
        $obj3->setStatus('draft');
        $manager->persist($obj3);

        $obj4 = new CampaignObject();
        $obj4->setCampaign($campaign1);
        $obj4->setType('article');
        $obj4->setTitle('Why Product X Changes Everything');
        $obj4->setContent('In-depth blog article about the technology behind Product X and its impact on the industry.');
        $obj4->setStatus('draft');
        $obj4->addTag($tags['SEO']);
        $manager->persist($obj4);

        $obj5 = new CampaignObject();
        $obj5->setCampaign($campaign2);
        $obj5->setType('post');
        $obj5->setTitle('Weekly Brand Spotlight');
        $obj5->setContent('This week we highlight our commitment to sustainable innovation. #BrandValues');
        $obj5->setStatus('draft');
        $obj5->addTag($tags['Brand']);
        $manager->persist($obj5);

        $obj6 = new CampaignObject();
        $obj6->setCampaign($campaign3);
        $obj6->setType('video');
        $obj6->setTitle('Holiday Greeting Video');
        $obj6->setContent('Animated holiday greeting video for social media distribution.');
        $obj6->setStatus('published');
        $obj6->addTag($tags['Video Marketing']);
        $manager->persist($obj6);

        $obj7 = new CampaignObject();
        $obj7->setCampaign($campaign3);
        $obj7->setType('advertisement');
        $obj7->setTitle('Holiday Sale Banner Ad');
        $obj7->setContent('Promotional banner ad for holiday sale - 20% off all products.');
        $obj7->setStatus('published');
        $manager->persist($obj7);

        $manager->flush();
    }
}
