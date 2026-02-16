<?php

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\CampaignMember;
use App\Message\SendNotification;
use App\Repository\CampaignMemberRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Messenger\MessageBusInterface;

final class CampaignMemberProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly ProcessorInterface $persistProcessor,
        private readonly Security $security,
        private readonly CampaignMemberRepository $memberRepo,
        private readonly MessageBusInterface $bus,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof CampaignMember) {
            return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
        }

        $currentUser = $this->security->getUser();
        $campaign = $data->getCampaign();

        if (!$campaign || $campaign->getOwner() !== $currentUser) {
            throw new AccessDeniedHttpException('Only the campaign owner can manage team members.');
        }

        $invitedUser = $data->getUser();

        if ($invitedUser === $campaign->getOwner()) {
            throw new BadRequestHttpException('The campaign owner cannot be added as a team member.');
        }

        if ($this->memberRepo->isMember($campaign, $invitedUser)) {
            throw new ConflictHttpException('This user is already a team member of this campaign.');
        }

        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        $this->bus->dispatch(new SendNotification(
            userId: $invitedUser->getId()->toRfc4122(),
            type: 'member',
            title: 'You were added to a campaign',
            message: sprintf('You have been invited as %s to "%s".', $data->getRole(), $campaign->getName()),
            data: [
                'campaignId' => $campaign->getId()->toRfc4122(),
                'link' => '/dashboard/campaigns/' . $campaign->getId()->toRfc4122(),
            ],
        ));

        return $result;
    }
}
