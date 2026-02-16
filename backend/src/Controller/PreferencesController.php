<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\UserPreference;
use App\Repository\UserPreferenceRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class PreferencesController extends AbstractController
{
    private const DEFAULTS = [
        'notify.content' => 'true',
        'notify.publication' => 'true',
        'notify.campaign' => 'true',
        'notify.generation' => 'true',
        'notify.mention' => 'true',
        'notify.member' => 'true',
        'notify.email' => 'false',
    ];

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPreferenceRepository $prefRepo,
    ) {
    }

    #[Route('/api/me/preferences', name: 'api_preferences_get', methods: ['GET'])]
    public function getPreferences(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        /** @var User $user */
        $user = $this->getUser();
        $stored = $this->prefRepo->getPreferencesForUser($user);

        // Merge defaults with stored values
        $result = self::DEFAULTS;
        foreach ($stored as $key => $value) {
            $result[$key] = $value;
        }

        return $this->json($result);
    }

    #[Route('/api/me/preferences', name: 'api_preferences_update', methods: ['PATCH'])]
    public function updatePreferences(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true);

        if (!$data || !is_array($data)) {
            return $this->json(['error' => 'Invalid JSON payload.'], Response::HTTP_BAD_REQUEST);
        }

        foreach ($data as $key => $value) {
            if (!array_key_exists($key, self::DEFAULTS)) {
                continue;
            }

            $pref = $this->prefRepo->findByUserAndKey($user, $key);
            if (!$pref) {
                $pref = new UserPreference();
                $pref->setUser($user);
                $pref->setKey($key);
                $this->em->persist($pref);
            }
            $pref->setValue((string) $value);
        }

        $this->em->flush();

        // Return merged preferences
        $stored = $this->prefRepo->getPreferencesForUser($user);
        $result = self::DEFAULTS;
        foreach ($stored as $key => $value) {
            $result[$key] = $value;
        }

        return $this->json($result);
    }
}
