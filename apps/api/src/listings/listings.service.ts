import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from '../entities/listing.entity.js';
import { CreateListingDto } from './dto/create-listing.dto.js';
import { UpdateListingDto } from './dto/update-listing.dto.js';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
  ) {}

  async findAll(workspaceId: string, page = 1, limit = 50): Promise<Listing[]> {
    return this.listingRepo.find({
      where: { workspaceId },
      relations: ['listingAgent'],
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
      skip: (page - 1) * limit,
    });
  }

  async findById(id: string, workspaceId: string): Promise<Listing> {
    const listing = await this.listingRepo.findOne({
      where: { id, workspaceId },
      relations: ['listingAgent'],
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  async create(
    dto: CreateListingDto,
    workspaceId: string,
    agentId: string,
  ): Promise<Listing> {
    const listing = this.listingRepo.create({
      ...dto,
      workspaceId,
      listingAgentId: agentId,
    });
    return this.listingRepo.save(listing);
  }

  async update(
    id: string,
    dto: UpdateListingDto,
    workspaceId: string,
  ): Promise<Listing> {
    const listing = await this.findById(id, workspaceId);
    const updated = this.listingRepo.create({ ...listing, ...dto });
    return this.listingRepo.save(updated);
  }

  async remove(id: string, workspaceId: string): Promise<void> {
    const listing = await this.findById(id, workspaceId);
    await this.listingRepo.remove(listing);
  }
}
