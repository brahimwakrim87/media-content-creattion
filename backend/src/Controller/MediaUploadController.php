<?php

namespace App\Controller;

use App\Entity\MediaAsset;
use App\Repository\MediaAssetRepository;
use Doctrine\ORM\EntityManagerInterface;
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
        'application/pdf',
    ];

    private const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    public function __construct(
        private readonly FilesystemOperator $mediaStorage,
        private readonly EntityManagerInterface $em,
        private readonly MediaAssetRepository $mediaAssetRepo,
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

        $mimeType = $file->getMimeType();
        if (!in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            return $this->json(
                ['error' => 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG, MP4, WebM, MOV, PDF.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            return $this->json(
                ['error' => 'File too large. Maximum size is 50MB.'],
                Response::HTTP_BAD_REQUEST,
            );
        }

        $extension = $file->guessExtension() ?? 'bin';
        $filename = Uuid::v4()->toRfc4122() . '.' . $extension;

        $stream = fopen($file->getPathname(), 'r');
        $this->mediaStorage->writeStream($filename, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        $url = '/media/' . $filename;

        // Detect image dimensions
        $width = null;
        $height = null;
        if (str_starts_with($mimeType, 'image/') && $mimeType !== 'image/svg+xml') {
            $imageSize = @getimagesize($file->getPathname());
            if ($imageSize) {
                $width = $imageSize[0];
                $height = $imageSize[1];
            }
        }

        // Persist MediaAsset
        $asset = new MediaAsset();
        $asset->setUploadedBy($this->getUser());
        $asset->setOriginalFilename($file->getClientOriginalName());
        $asset->setFilename($filename);
        $asset->setMimeType($mimeType);
        $asset->setSize($file->getSize());
        $asset->setUrl($url);
        $asset->setWidth($width);
        $asset->setHeight($height);

        $folder = $request->request->get('folder');
        if ($folder) {
            $asset->setFolder($folder);
        }

        $this->em->persist($asset);
        $this->em->flush();

        return $this->json([
            'id' => $asset->getId()->toRfc4122(),
            'url' => $url,
            'filename' => $filename,
            'originalFilename' => $file->getClientOriginalName(),
            'mimeType' => $mimeType,
            'size' => $file->getSize(),
            'width' => $width,
            'height' => $height,
            'mediaType' => $asset->getMediaType(),
            'folder' => $asset->getFolder(),
            'createdAt' => $asset->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ], Response::HTTP_CREATED);
    }

    #[Route('/api/media/stats', name: 'api_media_stats', methods: ['GET'], priority: 10)]
    public function stats(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_USER');
        $user = $this->getUser();

        return $this->json([
            'totalFiles' => $this->mediaAssetRepo->countByUser($user),
            'totalSize' => $this->mediaAssetRepo->totalSizeByUser($user),
            'folders' => $this->mediaAssetRepo->foldersForUser($user),
        ]);
    }

    #[Route('/api/media/{id}', name: 'api_media_delete', methods: ['DELETE'], priority: 5)]
    public function delete(string $id): Response
    {
        $this->denyAccessUnlessGranted('ROLE_USER');

        $asset = $this->em->getRepository(MediaAsset::class)->find($id);
        if (!$asset || $asset->getUploadedBy() !== $this->getUser()) {
            throw $this->createNotFoundException();
        }

        // Delete from filesystem
        try {
            $this->mediaStorage->delete($asset->getFilename());
        } catch (\Throwable) {
            // File may already be deleted
        }

        $this->em->remove($asset);
        $this->em->flush();

        return new Response(null, Response::HTTP_NO_CONTENT);
    }
}
