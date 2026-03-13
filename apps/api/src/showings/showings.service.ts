import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Showing } from '../entities/showing.entity.js';
import { Listing } from '../entities/listing.entity.js';
import { CreateShowingDto } from './dto/create-showing.dto.js';
import { UpdateShowingDto } from './dto/update-showing.dto.js';

@Injectable()
export class ShowingsService {
  constructor(
    @InjectRepository(Showing)
    private readonly showingRepo: Repository<Showing>,
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
  ) {}

  async findAll(
    workspaceId: string,
    page = 1,
    limit = 50,
  ): Promise<Showing[]> {
    return this.showingRepo.find({
      where: { workspaceId },
      relations: ['listing', 'agent'],
      order: { scheduledAt: 'ASC' },
      take: Math.min(limit, 100),
      skip: (page - 1) * limit,
    });
  }

  async findById(id: string, workspaceId: string): Promise<Showing> {
    const showing = await this.showingRepo.findOne({
      where: { id, workspaceId },
      relations: ['listing', 'agent'],
    });
    if (!showing) {
      throw new NotFoundException('Showing not found');
    }
    return showing;
  }

  async findByListing(
    listingId: string,
    workspaceId: string,
  ): Promise<Showing[]> {
    return this.showingRepo.find({
      where: { listingId, workspaceId },
      relations: ['agent'],
      order: { scheduledAt: 'ASC' },
    });
  }

  async create(
    dto: CreateShowingDto,
    workspaceId: string,
    agentId: string,
  ): Promise<Showing> {
    const listing = await this.listingRepo.findOne({
      where: { id: dto.listingId, workspaceId },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found in this workspace');
    }

    const showing = this.showingRepo.create({
      ...dto,
      scheduledAt: new Date(dto.scheduledAt),
      workspaceId,
      agentId,
    });
    return this.showingRepo.save(showing);
  }

  async update(
    id: string,
    dto: UpdateShowingDto,
    workspaceId: string,
  ): Promise<Showing> {
    const showing = await this.findById(id, workspaceId);
    const { scheduledAt, ...rest } = dto;
    const updates: Partial<Showing> = { ...rest };
    if (scheduledAt) {
      updates.scheduledAt = new Date(scheduledAt);
    }
    const updated = this.showingRepo.create({ ...showing, ...updates });
    return this.showingRepo.save(updated);
  }

  async remove(id: string, workspaceId: string): Promise<void> {
    const showing = await this.findById(id, workspaceId);
    await this.showingRepo.remove(showing);
  }
}
