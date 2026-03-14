export interface DashboardSummary {
  readonly listings: {
    readonly total: number;
    readonly active: number;
    readonly pending: number;
    readonly sold: number;
  };
  readonly showings: {
    readonly total: number;
    readonly scheduled: number;
    readonly completed: number;
  };
  readonly offers: {
    readonly total: number;
    readonly submitted: number;
    readonly accepted: number;
  };
  readonly team: {
    readonly total: number;
    readonly active: number;
  };
}
