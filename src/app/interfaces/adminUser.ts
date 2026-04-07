// modelos/user.model.ts
export interface AdminUser {
  id: string;
  username: string;
  email: string;
  avatar: string;
  dni: string;
  role: string;
  firstName: string;
  lastName: string;
  address?: string;
  birthdate?: string;
  createdAt?: string;
  phone?: string;
  distrito?: string;
  active: boolean;
}
