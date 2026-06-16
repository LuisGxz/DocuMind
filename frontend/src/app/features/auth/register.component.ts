import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { LanguageService } from '../../core/language.service';
import { parseApiError } from '../../core/api-error';
import { BrandMarkComponent } from '../../shared/brand-mark.component';
import { IconComponent } from '../../shared/icon.component';
import { LangToggleComponent } from '../../shared/lang-toggle.component';
import { AUTH_PANEL_STYLES } from './auth-panel.styles';

@Component({
  selector: 'dm-register',
  imports: [FormsModule, RouterLink, BrandMarkComponent, IconComponent, LangToggleComponent],
  template: `
    <div class="auth">
      <aside class="hero ai-grad">
        <div class="hero-top">
          <dm-brand [tile]="32" />
          <dm-lang-toggle />
        </div>
        <div class="hero-body">
          <h1>{{ lang.isEs() ? 'Empieza en segundos.' : 'Get started in seconds.' }}</h1>
          <p>
            {{
              lang.isEs()
                ? 'Crea tu cuenta y explora el workspace de demo con contratos reales ya indexados.'
                : 'Create your account and explore the demo workspace with real contracts already indexed.'
            }}
          </p>
          <ul class="bullets">
            <li>
              <dm-icon name="sparkles" [size]="16" />
              {{ lang.isEs() ? 'Chat con citas a la página exacta' : 'Chat with page-exact citations' }}
            </li>
            <li>
              <dm-icon name="book-open" [size]="16" />
              {{ lang.isEs() ? 'Corpus legal de ejemplo listo' : 'Sample legal corpus ready to query' }}
            </li>
          </ul>
        </div>
      </aside>

      <section class="panel">
        <div class="panel-top"><dm-lang-toggle /></div>
        <div class="form-wrap">
          <h2>{{ t().register.title }}</h2>
          <p class="sub">{{ t().register.subtitle }}</p>

          <form (ngSubmit)="submit()" #f="ngForm" novalidate>
            <div class="field">
              <label for="fullName">{{ t().register.fullName }}</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                class="input"
                autocomplete="name"
                [(ngModel)]="fullName"
                required
                minlength="2"
                [disabled]="loading()"
              />
            </div>
            <div class="field">
              <label for="email">{{ t().register.email }}</label>
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
              <label for="password">{{ t().register.password }}</label>
              <input
                id="password"
                name="password"
                type="password"
                class="input"
                autocomplete="new-password"
                [(ngModel)]="password"
                required
                minlength="8"
                [disabled]="loading()"
              />
              <span class="field-hint">{{ t().register.passwordHint }}</span>
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
                <dm-icon name="loader" [size]="18" class="spin" /> {{ t().register.creating }}
              } @else {
                {{ t().register.create }}
              }
            </button>
          </form>

          <div class="note">
            <dm-icon name="help-circle" [size]="16" />
            <span>{{ t().register.note }}</span>
          </div>

          <p class="switch">
            {{ t().register.already }}
            <a routerLink="/login">{{ t().register.signIn }}</a>
          </p>
        </div>
      </section>
    </div>
  `,
  styles: [
    AUTH_PANEL_STYLES,
    `
      .field-hint {
        font-size: 0.76rem;
        color: var(--ink-400);
      }
    `,
  ],
})
export class RegisterComponent {
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected fullName = '';
  protected email = '';
  protected password = '';
  protected readonly loading = signal(false);
  protected readonly errors = signal<string[]>([]);

  protected async submit(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.errors.set([]);
    try {
      await this.auth.register(this.email.trim(), this.password, this.fullName.trim());
      await this.router.navigateByUrl('/library');
    } catch (err) {
      this.errors.set(parseApiError(err, this.t().register.errorFallback));
    } finally {
      this.loading.set(false);
    }
  }
}
