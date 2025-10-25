import { BaseEntity, Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../helpers/enum.roles';
import { Venta } from '../../venta/entities/venta.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column( {unique: true})
  email: string;

  @Column()
  password: string;

  @Column()
  phone: string;

  @Column()
  address: string;

  // Columna enum para los dos tipos de roles: empleado o dueño
  @Column({
    type: 'enum', // Tipo de columna 'enum' en la base de datos
    enum: UserRole, // Referencia al enum de TypeScript
    default: UserRole.EMPLOYEE, // Valor por defecto: 'Empleado'
  })
  role: UserRole; // Nombre de la columna será 'role'

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  //Columna para soft-delete
  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  //Columna para token de recuperación de contraseña
  @Column({ type: 'text', nullable: true })
  resetPasswordToken?: string | null; 

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires?: Date | null;

  //relación con ventas
  @OneToMany(() => Venta, (venta) => venta.usuario) 
  ventas: Venta[]; 

}