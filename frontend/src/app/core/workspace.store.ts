import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { WorkspaceSummary } from './models';

/**
 * Caches the user's workspaces so the role badge, library, and document views
 * share one source of truth (the demo has a single workspace). Refreshed after
 * uploads/deletes so document and page counts stay accurate.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  private readonly api = inject(ApiService);

  readonly workspaces = signal<WorkspaceSummary[]>([]);
  readonly primary = computed<WorkspaceSummary | null>(() => this.workspaces()[0] ?? null);
  readonly role = computed(() => this.primary()?.role ?? null);

  private loaded = false;

  async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.workspaces.set(await firstValueFrom(this.api.getWorkspaces()));
    this.loaded = true;
  }

  clear(): void {
    this.workspaces.set([]);
    this.loaded = false;
  }
}
