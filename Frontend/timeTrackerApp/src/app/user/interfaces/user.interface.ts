export interface UserProfile {
    id: number;
    nombre: string;
    email: string;
    fechaCreacion?: Date;
    fechaActualizacion?: Date;
    usuarioCreacion?: string;
    usuarioActualizacion?: string;
  }

  export interface UpdateUserRequest {
    id: number;
    nombre: string;
    email: string;
    usuarioActualizacion: string;
  }

  export interface UpdatePasswordRequest {
    userId: number;
    currentPassword: string;
    newPassword: string;
  }

  export interface ResetPasswordRequest {
    userId: number;
    newPassword: string;
  }