import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer } from '../entities/offer.entity.js';
import { Listing } from '../entities/listing.entity.js';
import { CreateOfferDto } from './dto/create-offer.dto.js';
import { UpdateOfferDto } from './dto/update-offer.dto.js';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(Listing)
    private readonly listingRepo: Repository<Listing>,
  ) {}

  async findAll(
    workspaceId: string,
    page = 1,
    limit = 50,
  ): Promise<Offer[]> {
    return this.offerRepo.find({
      where: { workspaceId },
      relations: ['listing', 'agent'],
      order: { submittedAt: 'DESC' },
      take: Math.min(limit, 100),
      skip: (page - 1) * limit,
    });
  }

  async findById(id: string, workspaceId: string): Promise<Offer> {
    const offer = await this.offerRepo.findOne({
      where: { id, workspaceId },
      relations: ['listing', 'agent'],
    });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    return offer;
  }

  async findByListing(
    listingId: string,
    workspaceId: string,
  ): Promise<Offer[]> {
    return this.offerRepo.find({
      where: { listingId, workspaceId },
      relations: ['agent'],
      order: { submittedAt: 'DESC' },
    });
  }

  async create(
    dto: CreateOfferDto,
    workspaceId: string,
    agentId: string,
  ): Promise<Offer> {
    const listing = await this.listingRepo.findOne({
      where: { id: dto.listingId, workspaceId },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found in this workspace');
    }

    const offer = this.offerRepo.create({
      ...dto,
      submittedAt: new Date(),
      expirationDate: dto.expirationDate
        ? new Date(dto.expirationDate)
        : null,
      workspaceId,
      agentId,
    });
    return this.offerRepo.save(offer);
  }

  async update(
    id: string,
    dto: UpdateOfferDto,
    workspaceId: string,
  ): Promise<Offer> {
    const offer = await this.findById(id, workspaceId);
    const { expirationDate, ...rest } = dto;
    const updates: Partial<Offer> = { ...rest };
    if (expirationDate) {
      updates.expirationDate = new Date(expirationDate);
    }
    const updated = this.offerRepo.create({ ...offer, ...updates });
    return this.offerRepo.save(updated);
  }

  async remove(id: string, workspaceId: string): Promise<void> {
    const offer = await this.findById(id, workspaceId);
    await this.offerRepo.remove(offer);
  }
}
