<?php

namespace App\Repository;

use App\Entity\User;
use App\Entity\UserPreference;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<UserPreference>
 */
class UserPreferenceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserPreference::class);
    }

    /**
     * @return array<string, string> key => value map
     */
    public function getPreferencesForUser(User $user): array
    {
        $prefs = $this->findBy(['user' => $user]);
        $result = [];
        foreach ($prefs as $pref) {
            $result[$pref->getKey()] = $pref->getValue();
        }
        return $result;
    }

    public function findByUserAndKey(User $user, string $key): ?UserPreference
    {
        return $this->findOneBy(['user' => $user, 'key' => $key]);
    }
}
