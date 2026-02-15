<?php

namespace App\MessageHandler;

use App\Entity\CampaignObject;
use App\Entity\GenerationJob;
use App\Message\GenerateContent;
use App\Message\SendNotification;
use App\Service\AnthropicClaudeService;
use App\Service\N8nTriggerService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsMessageHandler]
final class GenerateContentHandler
{
    public function __construct(
        private readonly AnthropicClaudeService $claudeService,
        private readonly N8nTriggerService $n8nService,
        private readonly EntityManagerInterface $em,
        private readonly MessageBusInterface $messageBus,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function __invoke(GenerateContent $message): void
    {
        $job = $this->em->find(GenerationJob::class, $message->getGenerationJobId());
        $object = $this->em->find(CampaignObject::class, $message->getCampaignObjectId());

        if (!$job || !$object) {
            $this->logger->error('GenerateContent: Job or Object not found', [
                'jobId' => $message->getGenerationJobId(),
                'objectId' => $message->getCampaignObjectId(),
            ]);
            return;
        }

        $startTime = hrtime(true);
        $job->setStatus('processing');
        $this->em->flush();

        try {
            match ($message->getContentType()) {
                'post', 'article', 'advertisement' => $this->handleTextGeneration($message, $job, $object, $startTime),
                'image' => $this->handleImageGeneration($message, $job, $object),
                'video' => $this->handleVideoGeneration($message, $job, $object),
                default => throw new \InvalidArgumentException("Unsupported content type: {$message->getContentType()}"),
            };
        } catch (\Throwable $e) {
            $this->logger->error('Content generation failed', [
                'jobId' => $job->getId()->toRfc4122(),
                'error' => $e->getMessage(),
            ]);
            $this->markFailed($job, $object, $e->getMessage());
        }
    }

    private function handleTextGeneration(GenerateContent $message, GenerationJob $job, CampaignObject $object, int $startTime): void
    {
        $result = $this->claudeService->generate(
            $message->getContentType(),
            $message->getPrompt(),
            $message->getOptions() ?? [],
        );

        $processingTimeMs = (int) ((hrtime(true) - $startTime) / 1_000_000);

        $object->setContent($result['content']);
        $object->setStatus('ready');
        $object->setGenerationMeta([
            'lastGeneratedAt' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            'provider' => 'anthropic_claude',
            'tokensUsed' => $result['tokensUsed'],
            'contentType' => $message->getContentType(),
        ]);

        $job->setStatus('completed');
        $job->setResult($result['content']);
        $job->setTokensUsed($result['tokensUsed']);
        $job->setProcessingTimeMs($processingTimeMs);
        $job->setCompletedAt(new \DateTimeImmutable());

        $this->em->flush();

        $this->messageBus->dispatch(new SendNotification(
            $job->getRequestedBy()->getId()->toRfc4122(),
            'generation_complete',
            'Content Generated',
            "Your {$message->getContentType()} has been generated successfully.",
            ['objectId' => $object->getId()->toRfc4122(), 'jobId' => $job->getId()->toRfc4122()],
        ));
    }

    private function handleImageGeneration(GenerateContent $message, GenerationJob $job, CampaignObject $object): void
    {
        $this->n8nService->triggerImageWorkflow(
            $job->getId()->toRfc4122(),
            $object->getId()->toRfc4122(),
            $message->getPrompt(),
            $message->getOptions() ?? [],
        );

        $this->logger->info('Image generation delegated to N8N', [
            'jobId' => $job->getId()->toRfc4122(),
        ]);
    }

    private function handleVideoGeneration(GenerateContent $message, GenerationJob $job, CampaignObject $object): void
    {
        $this->n8nService->triggerVideoWorkflow(
            $job->getId()->toRfc4122(),
            $object->getId()->toRfc4122(),
            $message->getPrompt(),
            $message->getOptions() ?? [],
        );

        $this->logger->info('Video generation delegated to N8N', [
            'jobId' => $job->getId()->toRfc4122(),
        ]);
    }

    private function markFailed(GenerationJob $job, CampaignObject $object, string $error): void
    {
        $job->setStatus('failed');
        $job->setErrorMessage($error);
        $job->setCompletedAt(new \DateTimeImmutable());

        $object->setStatus('draft');

        $this->em->flush();
    }
}
