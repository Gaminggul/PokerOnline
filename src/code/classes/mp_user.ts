import type { Role, User as PrismaUser } from "@prisma/client";

export class MPUser {
    id: string;
    name: string;
    email?: string;
    emailVerified?: Date;
    image?: string;
    createdAt: Date;
    role: Role;
    chips: number;
    timeout?: Date;
    channel?: string;

    constructor(user: PrismaUser) {
        this.id = user.id;
        this.name = user.name;
        this.email = user.email ?? undefined;
        this.emailVerified = user.emailVerified ?? undefined;
        this.image = user.image ?? undefined;
        this.createdAt = user.createdAt;
        this.role = user.role;
        this.chips = user.chips;
        this.timeout = user.timeout ?? undefined;
        this.channel = user.channel ?? undefined;
    }
}
