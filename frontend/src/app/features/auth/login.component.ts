import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { LanguageService } from '../../core/language.service';
import { parseApiError } from '../../core/api-error';
import { BrandMarkComponent } from '../../shared/brand-mark.component';
import { IconComponent } from '../../shared/icon.component';
import { LangToggleComponent } from '../../shared/lang-toggle.component';
import { AUTH_PANEL_STYLES } from './auth-panel.styles';

interface DemoAccount {
  email: string;
  password: string;
  labelKey: 'demoOwner' | 'demoViewer';
  role: 'Owner' | 'Viewer';
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'owner@documind.dev', password: 'Owner1234!', labelKey: 'demoOwner', role: 'Owner' },
  { email: 'viewer@documind.dev', password: 'Viewer1234!', labelKey: 'demoViewer', role: 'Viewer' },
];

@Component({
  selector: 'dm-login',
  imports: [FormsModule, RouterLink, BrandMarkComponent, IconComponent, LangToggleComponent],
  template: `
    <div class="auth">
      <aside class="hero ai-grad">
        <div class="hero-top">
          <dm-brand [tile]="32" />
          <dm-lang-toggle />
        </div>
        <div class="hero-body">
          <h1>{{ lang.isEs() ? 'Pregúntale a tus documentos.' : 'Ask your documents.' }}</h1>
          <p>
            {{
              lang.isEs()
                ? 'Sube un contrato y pregunta en lenguaje natural. DocuMind responde citando el documento — con la fuente exacta.'
                : 'Upload a contract and ask in plain language. DocuMind answers by citing the document — with the exact source.'
            }}
          </p>
          <ul class="bullets">
            <li>
              <dm-icon name="sparkles" [size]="16" />
              {{ lang.isEs() ? 'Respuestas con citas verificables' : 'Answers with verifiable citations' }}
            </li>
            <li>
              <dm-icon name="shield-check" [size]="16" />
              {{ lang.isEs() ? 'Procesado local, sin entrenar modelos' : 'Processed locally, never trains models' }}
            </li>
            <li>
              <dm-icon name="book-open" [size]="16" />
              {{ lang.isEs() ? 'Búsqueda semántica real (pgvector)' : 'Real semantic search (pgvector)' }}
            </li>
          </ul>
        </div>
      </aside>

      <section class="panel">
        <div class="panel-top"><dm-lang-toggle /></div>
        <div class="form-wrap">
          <h2>{{ t().login.title }}</h2>
          <p class="sub">{{ t().login.subtitle }}</p>

          <form (ngSubmit)="submit()" #f="ngForm" novalidate>
            <div class="field">
              <label for="email">{{ t().login.email }}</label>
              <input
                id="email"
                name="email"
                type="email"
                class="input"
                autocomplete="email"
                [(ngModel)]="email"
                required
                [disabled]="loading()"
              />
            </div>
            <div class="field">
              <label for="password">{{ t().login.password }}</label>
              <input
                id="password"
                name="password"
                type="password"
                class="input"
                autocomplete="current-password"
                [(ngModel)]="password"
                required
                [disabled]="loading()"
              />
            </div>

            @if (errors().length) {
              <div class="alert alert-danger" role="alert">
                <dm-icon name="alert-triangle" [size]="18" />
                <div>
                  @for (e of errors(); track e) {
                    <div>{{ e }}</div>
                  }
                </div>
              </div>
            }

            <button class="btn btn-primary btn-block" type="submit" [disabled]="loading() || !f.valid">
              @if (loading()) {
                <dm-icon name="loader" [size]="18" class="spin" /> {{ t().login.signingIn }}
              } @else {
                {{ t().login.signIn }}
              }
            </button>
          </form>

          <div class="demo">
            <span class="demo-label">{{ t().login.demoLabel }}</span>
            @for (acc of demoAccounts; track acc.email) {
              <button type="button" class="demo-row" (click)="useDemo(acc)" [disabled]="loading()">
                <span
                  class="role-pill"
                  [class.role-owner]="acc.role === 'Owner'"
                  [class.role-viewer]="acc.role === 'Viewer'"
                  >{{ lang.role(acc.role) }}</span
                >
                <span class="demo-text">{{ t().login[acc.labelKey] }}</span>
                <span class="demo-use">{{ t().login.useThis }} <dm-icon name="arrow-right" [size]="14" /></span>
              </button>
            }
          </div>

          <p class="switch">
            {{ t().login.noAccount }}
            <a routerLink="/register">{{ t().login.createOne }}</a>
          </p>
        </div>
      </section>
    </div>
  `,
  styles: AUTH_PANEL_STYLES,
})
export class LoginComponent {
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly demoAccounts = DEMO_ACCOUNTS;
  protected email = '';
  protected password = '';
  protected readonly loading = signal(false);
  protected readonly errors = signal<string[]>([]);

  protected useDemo(acc: DemoAccount): void {
    this.email = acc.email;
    this.password = acc.password;
    void this.submit();
  }

  protected async submit(): Promise<void> {
    if (this.loading() || !this.email || !this.password) return;
    this.loading.set(true);
    this.errors.set([]);
    try {
      await this.auth.login(this.email.trim(), this.password);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/library';
      await this.router.navigateByUrl(returnUrl);
    } catch (err) {
      this.errors.set(parseApiError(err, this.t().login.errorFallback));
    } finally {
      this.loading.set(false);
    }
  }
}
