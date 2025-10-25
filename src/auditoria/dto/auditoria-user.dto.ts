// auditoria-user.dto.ts
export class AuditoriaUserDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  role: string;

  constructor(partial: Partial<AuditoriaUserDTO>) {
    Object.assign(this, partial);
  }
}
