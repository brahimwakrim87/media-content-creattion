<?php

namespace App\Controller;

use App\Entity\CampaignObject;
use App\Entity\GenerationJob;
use App\Message\SendNotification;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Attribute\Route;

class N8nWebhookController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly MessageBusInterface $messageBus,
        private readonly LoggerInterface $logger,
        private readonly string $webhookSecret,
    ) {
    }

    #[Route('/api/webhooks/n8n', name: 'api_webhook_n8n', methods: ['POST'])]
    public function handleCallback(Request $request): JsonResponse
    {
        $body = $request->getContent();
        $signature = $request->headers->get('X-Webhook-Signature', '');

        // Verify HMAC signature
        $expectedSignature = hash_hmac('sha256', $body, $this->webhookSecret);
        if (!hash_equals($expectedSignature, $signature)) {
            $this->logger->warning('N8N webhook: Invalid signature');
            return $this->json(['error' => 'Invalid signature.'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($body, true);
        if (!$data) {
            return $this->json(['error' => 'Invalid JSON payload.'], Response::HTTP_BAD_REQUEST);
        }

        $jobId = $data['jobId'] ?? null;
        $objectId = $data['objectId'] ?? null;
        $status = $data['status'] ?? null;
        $mediaUrl = $data['mediaUrl'] ?? null;
        $error = $data['error'] ?? null;

        if (!$jobId || !$objectId || !$status) {
            return $this->json(
                ['error' => 'Missing required fields: jobId, objectId, status.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $job = $this->em->find(GenerationJob::class, $jobId);
        $object = $this->em->find(CampaignObject::class, $objectId);

        if (!$job || !$object) {
            $this->logger->error('N8N webhook: Job or Object not found', [
                'jobId' => $jobId,
                'objectId' => $objectId,
            ]);
            return $this->json(['error' => 'Job or Object not found.'], Response::HTTP_NOT_FOUND);
        }

        if ($status === 'completed') {
            $job->setStatus('completed');
            $job->setCompletedAt(new \DateTimeImmutable());

            if ($mediaUrl) {
                $object->setMediaUrl($mediaUrl);
                $job->setResult($mediaUrl);
            }

            $object->setStatus('ready');
            $object->setGenerationMeta([
                'lastGeneratedAt' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
                'provider' => $job->getProvider(),
                'mediaUrl' => $mediaUrl,
            ]);

            $this->logger->info('N8N webhook: Generation completed', [
                'jobId' => $jobId,
                'mediaUrl' => $mediaUrl,
            ]);

            // Notify user
            $this->messageBus->dispatch(new SendNotification(
                $job->getRequestedBy()->getId()->toRfc4122(),
                'generation_complete',
                'Media Generated',
                "Your {$object->getType()} has been processed successfully.",
                ['objectId' => $objectId, 'jobId' => $jobId],
            ));
        } else {
            $job->setStatus('failed');
            $job->setErrorMessage($error ?? 'Unknown error from N8N');
            $job->setCompletedAt(new \DateTimeImmutable());

            $object->setStatus('draft');

            $this->logger->error('N8N webhook: Generation failed', [
                'jobId' => $jobId,
                'error' => $error,
            ]);
        }

        $this->em->flush();

        return $this->json(['received' => true]);
    }
}
