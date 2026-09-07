// logout-response.ts

import { ApiResponse } from '../../pages/shared/interfaces/api-response';

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutData {
  sesionRevocada: boolean;
  yaEstabaCerrada: boolean;
  sesionId?: number;
  fechaRevocacion?: string;
}

export type LogoutResponse = ApiResponse<LogoutData>;
