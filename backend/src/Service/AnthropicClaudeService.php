<?php

namespace App\Service;

use Psr\Log\LoggerInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class AnthropicClaudeService
{
    private const API_URL = 'https://api.anthropic.com/v1/messages';
    private const MODEL = 'claude-sonnet-4-5-20250929';

    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly LoggerInterface $logger,
        private readonly string $anthropicApiKey,
    ) {
    }

    /**
     * @param array{tone?: string, length?: string, platform?: string, language?: string} $options
     * @return array{content: string, tokensUsed: int}
     */
    public function generate(string $contentType, string $prompt, array $options = []): array
    {
        $systemPrompt = $this->buildSystemPrompt($contentType, $options);
        $maxTokens = $this->getMaxTokens($contentType, $options);

        $this->logger->info('Calling Anthropic Claude API', [
            'contentType' => $contentType,
            'model' => self::MODEL,
            'maxTokens' => $maxTokens,
        ]);

        $response = $this->httpClient->request('POST', self::API_URL, [
            'headers' => [
                'x-api-key' => $this->anthropicApiKey,
                'anthropic-version' => '2023-06-01',
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'model' => self::MODEL,
                'max_tokens' => $maxTokens,
                'system' => $systemPrompt,
                'messages' => [
                    ['role' => 'user', 'content' => $prompt],
                ],
            ],
        ]);

        $data = $response->toArray();
        $generatedText = $data['content'][0]['text'] ?? '';
        $tokensUsed = ($data['usage']['input_tokens'] ?? 0) + ($data['usage']['output_tokens'] ?? 0);

        $this->logger->info('Claude API response received', [
            'tokensUsed' => $tokensUsed,
            'contentLength' => strlen($generatedText),
        ]);

        return ['content' => $generatedText, 'tokensUsed' => $tokensUsed];
    }

    private function buildSystemPrompt(string $contentType, array $options): string
    {
        $tone = $options['tone'] ?? 'professional';
        $platform = $options['platform'] ?? 'general';
        $language = $options['language'] ?? 'English';

        $base = "You are an expert content creator. Write in a {$tone} tone. Language: {$language}.";

        return match ($contentType) {
            'post' => "{$base} Create a compelling social media post" .
                ($platform !== 'general' ? " optimized for {$platform}" : '') .
                '. Include relevant hashtags. Be concise and engaging. Do not include any preamble or explanation — output only the post content.',

            'article' => "{$base} Write a well-structured SEO-friendly article" .
                ($platform !== 'general' ? " suitable for {$platform}" : '') .
                '. Include a compelling headline, subheadings, and a conclusion. Use clear paragraphs. Do not include any preamble or explanation — output only the article content.',

            'advertisement' => "{$base} Create persuasive advertising copy" .
                ($platform !== 'general' ? " optimized for {$platform}" : '') .
                '. Include a strong headline, body copy, and call-to-action. Focus on benefits and emotional appeal. Do not include any preamble or explanation — output only the ad copy.',

            default => "{$base} Create high-quality content. Do not include any preamble or explanation — output only the content.",
        };
    }

    private function getMaxTokens(string $contentType, array $options): int
    {
        $length = $options['length'] ?? 'medium';

        $baseTokens = match ($contentType) {
            'post' => 500,
            'article' => 4096,
            'advertisement' => 1000,
            default => 2000,
        };

        return match ($length) {
            'short' => (int) ($baseTokens * 0.5),
            'long' => (int) ($baseTokens * 1.5),
            default => $baseTokens,
        };
    }
}
