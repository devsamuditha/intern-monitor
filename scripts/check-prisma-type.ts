import { PrismaClient } from '@prisma/client';

type ProjectCreateData = Parameters<PrismaClient['project']['create']>[0]['data'];

// Extract the type of ownerId property
type OwnerIdType = ProjectCreateData extends { ownerId?: infer V } ? V : never;

// Use a dummy function to force TypeScript to show the type
declare function assertType<T>(_val: T): void;
assertType<OwnerIdType>({} as OwnerIdType);

console.log('Type check passed');
