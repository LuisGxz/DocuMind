import { DocumentStatus, FileKind, Role } from './models';

export type Lang = 'en' | 'es';

/** Display translations for API enum values (stored in English on the backend). */
export const STATUS_EN: Record<DocumentStatus, string> = {
  Queued: 'Queued',
  Processing: 'Processing',
  Indexed: 'Indexed',
  Failed: 'Failed',
};
export const STATUS_ES: Record<DocumentStatus, string> = {
  Queued: 'En cola',
  Processing: 'Procesando',
  Indexed: 'Indexado',
  Failed: 'Falló',
};
export const STATUS_BADGE: Record<DocumentStatus, string> = {
  Queued: 'badge-neutral',
  Processing: 'badge-warn',
  Indexed: 'badge-ok',
  Failed: 'badge-danger',
};

export const ROLE_EN: Record<Role, string> = { Owner: 'Owner', Viewer: 'Viewer' };
export const ROLE_ES: Record<Role, string> = { Owner: 'Propietario', Viewer: 'Lector' };

export const FILEKIND_EN: Record<FileKind, string> = {
  pdf: 'PDF',
  word: 'Word',
  spreadsheet: 'Spreadsheet',
  markdown: 'Markdown',
  text: 'Text',
};
export const FILEKIND_ES: Record<FileKind, string> = {
  pdf: 'PDF',
  word: 'Word',
  spreadsheet: 'Hoja de cálculo',
  markdown: 'Markdown',
  text: 'Texto',
};

export interface AppCopy {
  header: {
    library: string;
    about: string;
    signOut: string;
    role: string;
  };
  footer: { tagline: string; built: string; demoNote: string };
  common: {
    loading: string;
    retry: string;
    error: string;
    back: string;
    cancel: string;
    save: string;
    saving: string;
    close: string;
    delete: string;
    confirm: string;
    page: string;
    pages: string;
    of: string;
  };
  login: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    signIn: string;
    signingIn: string;
    noAccount: string;
    createOne: string;
    demoLabel: string;
    demoOwner: string;
    demoViewer: string;
    useThis: string;
    errorFallback: string;
  };
  register: {
    title: string;
    subtitle: string;
    fullName: string;
    email: string;
    password: string;
    passwordHint: string;
    create: string;
    creating: string;
    already: string;
    signIn: string;
    errorFallback: string;
    note: string;
  };
  library: {
    title: string;
    subtitle: string;
    docCount: string;
    pageCount: string;
    upload: string;
    empty: string;
    emptyHint: string;
    conversations: string;
    uploadedBy: string;
    open: string;
    loadError: string;
  };
}

export const COPY: Record<Lang, AppCopy> = {
  en: {
    header: { library: 'Library', about: 'About', signOut: 'Sign out', role: 'Your role' },
    footer: {
      tagline: 'Ask your documents. Get answers with citations.',
      built: 'Built by Luis Chiquito Vera',
      demoNote: 'Demo — documents are processed locally and never used to train models.',
    },
    common: {
      loading: 'Loading…',
      retry: 'Retry',
      error: 'Something went wrong.',
      back: 'Back',
      cancel: 'Cancel',
      save: 'Save',
      saving: 'Saving…',
      close: 'Close',
      delete: 'Delete',
      confirm: 'Confirm',
      page: 'page',
      pages: 'pages',
      of: 'of',
    },
    login: {
      title: 'Welcome back',
      subtitle: 'Sign in to ask your documents anything.',
      email: 'Email',
      password: 'Password',
      signIn: 'Sign in',
      signingIn: 'Signing in…',
      noAccount: "Don't have an account?",
      createOne: 'Create one',
      demoLabel: 'Demo accounts',
      demoOwner: 'Owner — full access',
      demoViewer: 'Viewer — read & ask only',
      useThis: 'Use',
      errorFallback: "We couldn't sign you in. Check your details and try again.",
    },
    register: {
      title: 'Create your account',
      subtitle: 'Start asking your documents in seconds.',
      fullName: 'Full name',
      email: 'Email',
      password: 'Password',
      passwordHint: 'At least 8 characters.',
      create: 'Create account',
      creating: 'Creating…',
      already: 'Already have an account?',
      signIn: 'Sign in',
      errorFallback: "We couldn't create your account. Please try again.",
      note: 'New accounts can browse the demo workspace as a Viewer.',
    },
    library: {
      title: 'Library',
      subtitle: 'Your indexed documents — open one to ask questions with cited answers.',
      docCount: 'documents',
      pageCount: 'pages indexed',
      upload: 'Upload documents',
      empty: 'No documents yet',
      emptyHint: 'Upload a PDF, TXT, or Markdown file to start asking questions.',
      conversations: 'conversations',
      uploadedBy: 'by',
      open: 'Open',
      loadError: "We couldn't load this workspace.",
    },
  },
  es: {
    header: { library: 'Biblioteca', about: 'Acerca de', signOut: 'Cerrar sesión', role: 'Tu rol' },
    footer: {
      tagline: 'Pregunta a tus documentos. Obtén respuestas con citas.',
      built: 'Hecho por Luis Chiquito Vera',
      demoNote: 'Demo — los documentos se procesan localmente y nunca se usan para entrenar modelos.',
    },
    common: {
      loading: 'Cargando…',
      retry: 'Reintentar',
      error: 'Algo salió mal.',
      back: 'Volver',
      cancel: 'Cancelar',
      save: 'Guardar',
      saving: 'Guardando…',
      close: 'Cerrar',
      delete: 'Eliminar',
      confirm: 'Confirmar',
      page: 'pág.',
      pages: 'págs.',
      of: 'de',
    },
    login: {
      title: 'Bienvenido de nuevo',
      subtitle: 'Inicia sesión para preguntarle lo que sea a tus documentos.',
      email: 'Correo',
      password: 'Contraseña',
      signIn: 'Iniciar sesión',
      signingIn: 'Iniciando…',
      noAccount: '¿No tienes cuenta?',
      createOne: 'Crea una',
      demoLabel: 'Cuentas de demo',
      demoOwner: 'Propietario — acceso completo',
      demoViewer: 'Lector — solo leer y preguntar',
      useThis: 'Usar',
      errorFallback: 'No pudimos iniciar tu sesión. Revisa tus datos e inténtalo de nuevo.',
    },
    register: {
      title: 'Crea tu cuenta',
      subtitle: 'Empieza a preguntarle a tus documentos en segundos.',
      fullName: 'Nombre completo',
      email: 'Correo',
      password: 'Contraseña',
      passwordHint: 'Al menos 8 caracteres.',
      create: 'Crear cuenta',
      creating: 'Creando…',
      already: '¿Ya tienes cuenta?',
      signIn: 'Inicia sesión',
      errorFallback: 'No pudimos crear tu cuenta. Inténtalo de nuevo.',
      note: 'Las cuentas nuevas pueden explorar el workspace de demo como Lector.',
    },
    library: {
      title: 'Biblioteca',
      subtitle: 'Tus documentos indexados — abre uno para hacer preguntas con respuestas citadas.',
      docCount: 'documentos',
      pageCount: 'páginas indexadas',
      upload: 'Subir documentos',
      empty: 'Aún no hay documentos',
      emptyHint: 'Sube un PDF, TXT o Markdown para empezar a preguntar.',
      conversations: 'conversaciones',
      uploadedBy: 'por',
      open: 'Abrir',
      loadError: 'No pudimos cargar este workspace.',
    },
  },
};
