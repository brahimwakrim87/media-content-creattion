<?php

namespace App\Controller;

use League\Flysystem\FilesystemOperator;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

class MediaUploadController extends AbstractController
{
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'video/mp4',
        'video/webm',
        'video/quicktime',
    ];

    private const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    public function __construct(
        private readonly FilesystemOperator $mediaStorage,
    ) {
    }

    #[Route('/api/media/upload', name: 'api_media_upload', methods: ['POST'])]
    public function upload(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $file = $request->files->get('file');
        if (!$file) {
            return $this->json(['error' => 'No file provided.'], Response::HTTP_BAD_REQUEST);
        }

        if (!$file->isValid()) {
            return $this->json(['error' => 'File upload failed.'], Response::HTTP_BAD_REQUEST);
        }

        // Validate mime type
        $mimeType = $file->getMimeType();
        if (!in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            return $this->json(
                ['error' => 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG, MP4, WebM, MOV.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        // Validate size
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            return $this->json(
                ['error' => 'File too large. Maximum size is 50MB.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        // Generate unique filename
        $extension = $file->guessExtension() ?? 'bin';
        $filename = Uuid::v4()->toRfc4122() . '.' . $extension;

        // Store file via Flysystem
        $stream = fopen($file->getPathname(), 'r');
        $this->mediaStorage->writeStream($filename, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        return $this->json([
            'url' => '/media/' . $filename,
            'filename' => $filename,
            'mimeType' => $mimeType,
            'size' => $file->getSize(),
        ], Response::HTTP_CREATED);
    }
}
