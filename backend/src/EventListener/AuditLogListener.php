<?php

namespace App\EventListener;

use App\Entity\AuditLog;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Event\PostUpdateEventArgs;
use Doctrine\ORM\Event\PreRemoveEventArgs;
use Doctrine\ORM\Events;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\Uid\Uuid;

#[AsDoctrineListener(event: Events::postPersist)]
#[AsDoctrineListener(event: Events::postUpdate)]
#[AsDoctrineListener(event: Events::preRemove)]
class AuditLogListener
{
    public function __construct(
        private readonly Security $security,
        private readonly RequestStack $requestStack,
    ) {
    }

    public function postPersist(PostPersistEventArgs $args): void
    {
        $entity = $args->getObject();

        if ($entity instanceof AuditLog) {
            return;
        }

        $this->createAuditLog($args->getObjectManager(), 'create', $entity, [], $this->getEntityData($entity));
    }

    public function postUpdate(PostUpdateEventArgs $args): void
    {
        $entity = $args->getObject();

        if ($entity instanceof AuditLog) {
            return;
        }

        $em = $args->getObjectManager();
        $unitOfWork = $em->getUnitOfWork();
        $changeSet = $unitOfWork->getEntityChangeSet($entity);

        $oldValues = [];
        $newValues = [];

        foreach ($changeSet as $field => [$old, $new]) {
            $oldValues[$field] = $this->normalizeValue($old);
            $newValues[$field] = $this->normalizeValue($new);
        }

        $this->createAuditLog($em, 'update', $entity, $oldValues, $newValues);
    }

    public function preRemove(PreRemoveEventArgs $args): void
    {
        $entity = $args->getObject();

        if ($entity instanceof AuditLog) {
            return;
        }

        $this->createAuditLog(
            $args->getObjectManager(),
            'delete',
            $entity,
            $this->getEntityData($entity),
            [],
        );
    }

    private function createAuditLog(
        \Doctrine\ORM\EntityManagerInterface $em,
        string $action,
        object $entity,
        array $oldValues,
        array $newValues,
    ): void {
        $auditLog = new AuditLog();

        $currentUser = $this->security->getUser();
        if ($currentUser instanceof User) {
            $auditLog->setUser($currentUser);
        }

        $auditLog->setAction($action);
        $auditLog->setEntityType($this->getShortClassName($entity));

        if (method_exists($entity, 'getId') && $entity->getId() instanceof Uuid) {
            $auditLog->setEntityId($entity->getId());
        }

        $auditLog->setOldValues($oldValues ?: null);
        $auditLog->setNewValues($newValues ?: null);

        $request = $this->requestStack->getCurrentRequest();
        if ($request) {
            $auditLog->setIpAddress($request->getClientIp());
            $auditLog->setUserAgent(substr((string) $request->headers->get('User-Agent'), 0, 500));
        }

        $em->persist($auditLog);
        $em->flush();
    }

    private function getShortClassName(object $entity): string
    {
        $reflection = new \ReflectionClass($entity);

        return $reflection->getShortName();
    }

    private function getEntityData(object $entity): array
    {
        $data = [];

        $reflection = new \ReflectionClass($entity);

        foreach ($reflection->getProperties() as $property) {
            $value = $property->getValue($entity);
            $data[$property->getName()] = $this->normalizeValue($value);
        }

        return $data;
    }

    private function normalizeValue(mixed $value): mixed
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format(\DateTimeInterface::ATOM);
        }

        if ($value instanceof Uuid) {
            return $value->toRfc4122();
        }

        if (is_object($value)) {
            if (method_exists($value, 'getId')) {
                $id = $value->getId();

                return $id instanceof Uuid ? $id->toRfc4122() : (string) $id;
            }

            return $value::class;
        }

        if (is_array($value)) {
            return array_map(fn ($v) => $this->normalizeValue($v), $value);
        }

        return $value;
    }
}
