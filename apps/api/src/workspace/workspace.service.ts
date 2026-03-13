import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workspace } from '../entities/workspace.entity.js';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,
  ) {}

  async findById(id: string): Promise<Workspace> {
    const workspace = await this.workspaceRepo.findOne({ where: { id } });
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace;
  }

  async updateName(id: string, name: string): Promise<Workspace> {
    const workspace = await this.findById(id);
    const updated = this.workspaceRepo.create({ ...workspace, name });
    return this.workspaceRepo.save(updated);
  }
}
