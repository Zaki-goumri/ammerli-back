
export interface AlertingService {
  sendAlert(message: string): Promise<void>;
}
