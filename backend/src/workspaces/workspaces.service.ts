import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface WorkspaceSummary {
  id: string;
  slug: string;
  name: string;
  nameEs: string | null;
  description: string | null;
  descriptionEs: string | null;
  role: Role;
  documentCount: number;
  indexedPageCount: number;
  createdAt: Date;
}

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<WorkspaceSummary[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { workspace: { name: 'asc' } },
    });

    return Promise.all(
      memberships.map(async (m) => ({
        ...(await this.counts(m.workspaceId)),
        id: m.workspace.id,
        slug: m.workspace.slug,
        name: m.workspace.name,
        nameEs: m.workspace.nameEs,
        description: m.workspace.description,
        descriptionEs: m.workspace.descriptionEs,
        role: m.role,
        createdAt: m.workspace.createdAt,
      })),
    );
  }

  async getBySlugForUser(slug: string, role: Role): Promise<WorkspaceSummary> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
    });
    if (!workspace) throw new NotFoundException('Workspace not found.');

    return {
      ...(await this.counts(workspace.id)),
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      nameEs: workspace.nameEs,
      description: workspace.description,
      descriptionEs: workspace.descriptionEs,
      role,
      createdAt: workspace.createdAt,
    };
  }

  private async counts(
    workspaceId: string,
  ): Promise<{ documentCount: number; indexedPageCount: number }> {
    const agg = await this.prisma.document.aggregate({
      where: { workspaceId },
      _count: true,
      _sum: { pageCount: true },
    });
    return {
      documentCount: agg._count,
      indexedPageCount: agg._sum.pageCount ?? 0,
    };
  }
}
