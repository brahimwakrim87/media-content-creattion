<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Publication;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final class PublicationProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if ($data instanceof Publication && !$data->getId() && $data->getSocialAccount()) {
            $data->setPlatform($data->getSocialAccount()->getPlatform());
        }

        // Auto-set status to 'scheduled' when scheduledAt is provided on create
        if ($data instanceof Publication && !$data->getId() && $data->getScheduledAt() !== null) {
            $data->setStatus('scheduled');
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
