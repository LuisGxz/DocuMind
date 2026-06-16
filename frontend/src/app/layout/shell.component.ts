import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { LanguageService } from '../core/language.service';
import { Role } from '../core/models';
import { BrandMarkComponent } from '../shared/brand-mark.component';
import { IconComponent } from '../shared/icon.component';
import { LangToggleComponent } from '../shared/lang-toggle.component';

@Component({
  selector: 'dm-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    BrandMarkComponent,
    IconComponent,
    LangToggleComponent,
  ],
  template: `
    <header class="header">
      <div class="container bar">
        <a routerLink="/library" class="brand-link" aria-label="DocuMind">
          <dm-brand />
        </a>

        <nav class="nav">
          <a routerLink="/library" routerLinkActive="active">{{ t().header.library }}</a>
        </nav>

        <div class="right">
          <dm-lang-toggle />
          @if (auth.user(); as user) {
            @if (role(); as r) {
              <span
                class="role-pill"
                [class.role-owner]="r === 'Owner'"
                [class.role-viewer]="r === 'Viewer'"
                [title]="lang.role(r)"
              >
                {{ lang.role(r) }}
              </span>
            }
            <div class="user">
              <span class="who">{{ user.fullName }}</span>
              <button class="btn btn-subtle icon-btn" (click)="signOut()" [title]="t().header.signOut">
                <dm-icon name="log-out" [size]="18" />
              </button>
            </div>
          }
        </div>
      </div>
    </header>

    <main class="main">
      <router-outlet />
    </main>

    <footer class="footer">
      <div class="container foot">
        <span>{{ t().footer.tagline }}</span>
        <span class="dim">{{ t().footer.demoNote }}</span>
      </div>
    </footer>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .header {
      position: sticky;
      top: 0;
      z-index: 40;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border);
    }
    .bar {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      height: var(--header-h);
    }
    .brand-link {
      flex-shrink: 0;
    }
    .nav {
      display: flex;
      gap: 0.25rem;
    }
    .nav a {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ink-500);
      padding: 0.4rem 0.7rem;
      border-radius: var(--radius-sm);
      transition:
        color 150ms ease,
        background 150ms ease;
    }
    .nav a:hover {
      color: var(--ink-900);
      background: var(--ink-100);
    }
    .nav a.active {
      color: var(--aiblue-600);
      background: var(--aiblue-50);
    }
    .right {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .who {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--ink-700);
    }
    .icon-btn {
      padding: 0.4rem;
    }
    .main {
      flex: 1;
    }
    .footer {
      border-top: 1px solid var(--border);
      background: var(--surface);
      padding: 1.25rem 0;
      margin-top: 2rem;
    }
    .foot {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1.5rem;
      font-size: 0.8rem;
      color: var(--ink-500);
    }
    .foot .dim {
      color: var(--ink-400);
    }
    @media (max-width: 600px) {
      .bar {
        gap: 0.6rem;
      }
      .who,
      .nav {
        display: none;
      }
      .right {
        gap: 0.5rem;
      }
    }
  `,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly role = signal<Role | null>(null);

  constructor() {
    void this.loadRole();
  }

  private async loadRole(): Promise<void> {
    try {
      const workspaces = await firstValueFrom(this.api.getWorkspaces());
      this.role.set(workspaces[0]?.role ?? null);
    } catch {
      /* role badge is best-effort */
    }
  }

  protected async signOut(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
