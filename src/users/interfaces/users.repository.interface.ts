//ARCHIVO: users.repository.interface.ts
import { UserEntity } from "src/users/entities/user.entity";

export interface IUserRepository {
    findByEmail(email: string): Promise<UserEntity | null>;
    findById(id: number): Promise<UserEntity | null>;
    findAll(): Promise<UserEntity[]>;
    findAllDeleted(): Promise<UserEntity[]>;
    save(user: UserEntity): Promise<UserEntity>;
    update(id: number, user: Partial<UserEntity>): Promise<UserEntity | null>;
    softDelete(id: number): Promise<boolean>;
    restore(id: number): Promise<boolean>;
}