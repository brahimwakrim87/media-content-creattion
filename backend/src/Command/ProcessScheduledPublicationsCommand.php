<?php

namespace App\Command;

use App\Message\ProcessScheduledPublications;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Messenger\MessageBusInterface;

#[AsCommand(
    name: 'app:process-scheduled-publications',
    description: 'Dispatch a message to process all scheduled publications that are due.',
)]
final class ProcessScheduledPublicationsCommand extends Command
{
    public function __construct(
        private readonly MessageBusInterface $messageBus,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->messageBus->dispatch(new ProcessScheduledPublications());
        $output->writeln('<info>Dispatched ProcessScheduledPublications message.</info>');

        return Command::SUCCESS;
    }
}
