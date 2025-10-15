//ARCHIVO: users.repository.ts
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";

import { UserEntity } from "../entities/user.entity";
import { IUserRepository } from "../interfaces/users.repository.interface";

@Injectable()
export class UserRepository implements IUserRepository {

    constructor(
        @InjectRepository(UserEntity)
        private readonly repo: Repository<UserEntity>,
    ) {}


    async findAll(): Promise<UserEntity[]> {
        try {
            return this.repo.find();
        } catch (error) {
            throw new InternalServerErrorException('Error al obtener todos los usuarios. ' + error);
        }
    }

    async findAllDeleted(): Promise<UserEntity[]> {
        try {
            return this.repo.find({
            withDeleted: true,
            where: {
                deletedAt: Not(IsNull()),
            },
            });
        } catch (error) {
            throw new InternalServerErrorException('Error al obtener usuarios eliminados. ' + error);
        }
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        try {
            return await this.repo.findOneBy({ email });
        } catch (error) {
            throw new InternalServerErrorException('Error al buscar usuario por email. ' + error);
        }
    }

    async findById(id: number): Promise<UserEntity | null> {
        try {
            return await this.repo.findOneBy({ id });
        } catch (error) {
            throw new InternalServerErrorException('Error al buscar usuario por ID. ' + error);
        }
    }


  async save(user: UserEntity): Promise<UserEntity> {
    try {
      return await this.repo.save(user);
    } catch (error) {
      throw new InternalServerErrorException('Error al guardar el usuario. ' + error);
    }
  }

  async update(id: number, user: Partial<UserEntity>): Promise<UserEntity | null> {
    try {
        await this.repo.update(id, user);
        return await this.repo.findOneBy({ id })
    } catch (error) {
        throw new InternalServerErrorException('Error al actualizar el usuario. ' + error);
    }
  }

  async softDelete(id: number): Promise<boolean> {
    try {
        /*
            El método delete() de TypeORM devuelve un objeto DeleteResult. Su atributo .affected 
            puede valer:
                result.affected = 1: Se eliminó el registro.
                result.affected = 0: El id no existía, entonces no se hizo nada.
            Por eso hacemos la comparación lógica (result.affected !== 0), que puede ser:
                true: significa que el resultado fue 1, entonces se eliminó exitosamente.
                false: Significa que el resultado fue 0, entonces no se eliminó exitosamente.
        */
        const result = await this.repo.softDelete(id);
        return result.affected !== 0;
    } catch (error) {
        throw new InternalServerErrorException('Error al eliminar (soft-delete) el usuario. ' + error);
    }
  }

  async restore(id: number): Promise<boolean> {
    try {
        const result = await this.repo.restore(id);
        return result.affected !== 0;
    } catch (error) {
        throw new InternalServerErrorException('Error al restaurar el usuario. ' + error);
    }
  }
  async findByResetToken(token: string): Promise<UserEntity | null> {
    try {
        return await this.repo.findOne({ where: { resetPasswordToken: token } });
    } catch (error) {
        throw new InternalServerErrorException('Error al buscar usuario por token de reseteo. ' + error);
    }
  }
}