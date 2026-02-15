<?php

namespace App\Service;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class N8nTriggerService
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly LoggerInterface $logger,
        private readonly string $n8nWebhookBaseUrl,
        private readonly string $webhookSecret,
    ) {
    }

    public function triggerImageWorkflow(
        string $generationJobId,
        string $campaignObjectId,
        string $prompt,
        array $options = [],
    ): void {
        $this->sendWebhook('/image-process', [
            'jobId' => $generationJobId,
            'objectId' => $campaignObjectId,
            'type' => 'image',
            'prompt' => $prompt,
            'options' => $options,
        ]);
    }

    public function triggerVideoWorkflow(
        string $generationJobId,
        string $campaignObjectId,
        string $prompt,
        array $options = [],
    ): void {
        $this->sendWebhook('/video-process', [
            'jobId' => $generationJobId,
            'objectId' => $campaignObjectId,
            'type' => 'video',
            'prompt' => $prompt,
            'options' => $options,
        ]);
    }

    private function sendWebhook(string $path, array $payload): void
    {
        $jsonPayload = json_encode($payload, JSON_THROW_ON_ERROR);
        $signature = $this->sign($jsonPayload);
        $url = rtrim($this->n8nWebhookBaseUrl, '/') . $path;

        $this->logger->info('Triggering N8N workflow', [
            'url' => $url,
            'jobId' => $payload['jobId'],
            'type' => $payload['type'],
        ]);

        $this->httpClient->request('POST', $url, [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-Webhook-Signature' => $signature,
            ],
            'body' => $jsonPayload,
        ]);
    }

    private function sign(string $payload): string
    {
        return hash_hmac('sha256', $payload, $this->webhookSecret);
    }
}
