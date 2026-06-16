/** Shared split-panel styling for the login and register screens. */
export const AUTH_PANEL_STYLES = `
  :host { display: block; }
  .auth {
    display: grid;
    grid-template-columns: 1.05fr 1fr;
    min-height: 100vh;
  }

  /* ---- gradient hero ---- */
  .hero {
    color: #fff;
    padding: 2rem 2.5rem;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }
  .hero::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(60% 50% at 80% 10%, rgba(255, 255, 255, 0.18), transparent 70%),
      radial-gradient(50% 50% at 0% 100%, rgba(255, 255, 255, 0.12), transparent 70%);
    pointer-events: none;
  }
  .hero-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    z-index: 1;
  }
  .hero-top ::ng-deep .lang {
    border-color: rgba(255, 255, 255, 0.4);
  }
  .hero-top ::ng-deep .lang button {
    color: rgba(255, 255, 255, 0.85);
  }
  .hero-top ::ng-deep .lang button.active {
    background: rgba(255, 255, 255, 0.95);
    color: var(--aiblue-600);
  }
  .hero-body {
    margin-top: auto;
    margin-bottom: auto;
    max-width: 26rem;
    position: relative;
    z-index: 1;
  }
  .hero-body h1 {
    color: #fff;
    font-size: clamp(1.8rem, 3vw, 2.4rem);
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .hero-body p {
    margin-top: 1rem;
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    line-height: 1.6;
  }
  .bullets {
    list-style: none;
    margin: 1.75rem 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }
  .bullets li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.9rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.95);
  }

  /* ---- form panel ---- */
  .panel {
    display: grid;
    place-items: center;
    padding: 2rem 1.5rem;
    background: var(--canvas);
    position: relative;
  }
  .panel-top {
    display: none;
    position: absolute;
    top: 1.25rem;
    right: 1.25rem;
  }
  .form-wrap {
    width: 100%;
    max-width: 23rem;
  }
  .form-wrap h2 {
    font-size: 1.5rem;
  }
  .sub {
    color: var(--ink-500);
    font-size: 0.9rem;
    margin-top: 0.35rem;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    margin-top: 1.5rem;
  }
  form .btn {
    margin-top: 0.25rem;
  }

  /* ---- demo accounts ---- */
  .demo {
    margin-top: 1.5rem;
    border-top: 1px solid var(--border);
    padding-top: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .demo-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ink-400);
  }
  .demo-row {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 0.6rem 0.75rem;
    cursor: pointer;
    text-align: left;
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease,
      transform 120ms ease;
  }
  .demo-row:not(:disabled):hover {
    border-color: var(--aiblue-500);
    box-shadow: var(--shadow-sm);
    transform: translateY(-1px);
  }
  .demo-row:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .demo-text {
    font-size: 0.82rem;
    color: var(--ink-700);
    font-weight: 500;
  }
  .demo-use {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--aiblue-600);
  }

  .switch {
    margin-top: 1.5rem;
    font-size: 0.85rem;
    color: var(--ink-500);
    text-align: center;
  }
  .switch a {
    color: var(--aiblue-600);
    font-weight: 600;
  }
  .switch a:hover {
    text-decoration: underline;
  }

  .note {
    margin-top: 1rem;
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    font-size: 0.8rem;
    color: var(--ink-500);
    background: var(--aiblue-50);
    border-radius: var(--radius-md);
    padding: 0.7rem 0.8rem;
  }

  @media (max-width: 860px) {
    .auth {
      grid-template-columns: 1fr;
    }
    .hero {
      display: none;
    }
    .panel {
      min-height: 100vh;
    }
    .panel-top {
      display: flex;
    }
  }
`;
