<?php

namespace App\Controller;

use App\Entity\CampaignObject;
use App\Entity\GenerationJob;
use App\Message\GenerateContent;
use App\Repository\CampaignObjectRepository;
use App\Repository\GenerationJobRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Attribute\Route;

class ContentGenerationController extends AbstractController
{
    public function __construct(
        private readonly CampaignObjectRepository $objectRepo,
        private readonly GenerationJobRepository $jobRepo,
        private readonly EntityManagerInterface $em,
        private readonly MessageBusInterface $messageBus,
    ) {
    }

    #[Route('/api/content/generate', name: 'api_content_generate', methods: ['POST'])]
    public function generate(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $data = json_decode($request->getContent(), true);
        if (!$data) {
            return $this->json(['error' => 'Invalid JSON payload.'], Response::HTTP_BAD_REQUEST);
        }

        $objectId = $data['campaignObjectId'] ?? null;
        $prompt = $data['prompt'] ?? null;
        $options = $data['options'] ?? null;

        if (!$objectId || !$prompt) {
            return $this->json(
                ['error' => 'Missing required fields: campaignObjectId, prompt.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $object = $this->objectRepo->find($objectId);
        if (!$object) {
            return $this->json(['error' => 'Content not found.'], Response::HTTP_NOT_FOUND);
        }

        // Verify ownership
        $user = $this->getUser();
        if ($object->getCampaign()->getOwner() !== $user) {
            return $this->json(['error' => 'Access denied.'], Response::HTTP_FORBIDDEN);
        }

        if ($object->getStatus() === 'generating') {
            return $this->json(['error' => 'Content is already being generated.'], Response::HTTP_CONFLICT);
        }

        // Determine provider based on content type
        $provider = match ($object->getType()) {
            'post', 'article', 'advertisement' => 'anthropic_claude',
            'image' => 'n8n_image',
            'video' => 'n8n_video',
            default => 'anthropic_claude',
        };

        // Create generation job
        $job = new GenerationJob();
        $job->setCampaignObject($object);
        $job->setRequestedBy($user);
        $job->setProvider($provider);
        $job->setPrompt($prompt);
        $job->setOptions($options);

        $this->em->persist($job);

        // Update object status
        $object->setStatus('generating');

        $this->em->flush();

        // Dispatch async message
        $this->messageBus->dispatch(new GenerateContent(
            $job->getId()->toRfc4122(),
            $object->getId()->toRfc4122(),
            $object->getType(),
            $prompt,
            $options,
        ));

        return $this->json([
            'jobId' => $job->getId()->toRfc4122(),
            'status' => 'generating',
        ], Response::HTTP_ACCEPTED);
    }

    #[Route('/api/content/generate/{jobId}/status', name: 'api_generation_status', methods: ['GET'])]
    public function status(string $jobId): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $job = $this->jobRepo->find($jobId);
        if (!$job) {
            return $this->json(['error' => 'Job not found.'], Response::HTTP_NOT_FOUND);
        }

        // Verify ownership
        if ($job->getRequestedBy() !== $this->getUser()) {
            return $this->json(['error' => 'Access denied.'], Response::HTTP_FORBIDDEN);
        }

        return $this->json([
            'id' => $job->getId()->toRfc4122(),
            'status' => $job->getStatus(),
            'provider' => $job->getProvider(),
            'result' => $job->getResult(),
            'tokensUsed' => $job->getTokensUsed(),
            'processingTimeMs' => $job->getProcessingTimeMs(),
            'errorMessage' => $job->getErrorMessage(),
            'createdAt' => $job->getCreatedAt()->format(\DateTimeInterface::ATOM),
            'completedAt' => $job->getCompletedAt()?->format(\DateTimeInterface::ATOM),
        ]);
    }
}
