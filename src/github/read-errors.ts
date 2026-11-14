import { MaintenanceReadError } from "../maintenance/types";
export class GithubError extends MaintenanceReadError {
  constructor(
    public status: number,
    message: string,
    public retryAt?: number,
  ) {
    super(
      message,
      retryAt ? "rate-limit" : "unavailable",
      !retryAt && [401, 403, 404].includes(status),
    );
  }
}
