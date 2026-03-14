import type { Plan } from './common';

export interface Workspace {
  readonly id: string;
  readonly name: string;
  readonly plan: Plan;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpdateWorkspaceDto {
  readonly name: string;
}
