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
  header: { library: string; signOut: string };
  footer: { tagline: string; demoNote: string };
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
    viewerNoUpload: string;
  };
  upload: {
    title: string;
    drop: string;
    or: string;
    choose: string;
    accept: string;
    maxSize: string;
    uploading: string;
    processing: string;
    indexed: string;
    failed: string;
    queued: string;
    readyHint: string;
    openDoc: string;
    addAnother: string;
    done: string;
    errorFallback: string;
    encrypted: string;
  };
  doc: {
    back: string;
    pagesIndexed: string;
    summary: string;
    noSummary: string;
    download: string;
    reprocess: string;
    reprocessing: string;
    delete: string;
    deleteConfirm: string;
    notIndexed: string;
    page: string;
    loadError: string;
    mode: string;
  };
  chat: {
    title: string;
    placeholder: string;
    send: string;
    suggested: string;
    thinking: string;
    sources: string;
    copy: string;
    copied: string;
    you: string;
    newChat: string;
    emptyTitle: string;
    emptyHint: string;
    errorAnswer: string;
    viewerHint: string;
  };
  convos: {
    title: string;
    new: string;
    rename: string;
    renameTitle: string;
    delete: string;
    deleteConfirm: string;
    empty: string;
    messages: string;
    current: string;
  };
  demo: {
    badge: string;
    panelTitle: string;
    crossRoleTitle: string;
    crossRole: string;
    canOwner: string;
    canViewer: string;
    cannotViewer: string;
    replay: string;
    next: string;
    back: string;
    gotIt: string;
    skip: string;
    step: string;
    of: string;
    steps: { title: string; body: string }[];
  };
}

const EN: AppCopy = {
  header: { library: 'Library', signOut: 'Sign out' },
  footer: {
    tagline: 'Ask your documents. Get answers with citations.',
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
    viewerNoUpload: 'Only Owners can upload — open any document to ask questions.',
  },
  upload: {
    title: 'Upload a document',
    drop: 'Drop a file here',
    or: 'or',
    choose: 'Choose a file',
    accept: 'PDF, TXT, or Markdown',
    maxSize: 'up to 15 MB',
    uploading: 'Uploading…',
    processing: 'Indexing — extracting & embedding pages',
    indexed: 'Indexed and ready for questions',
    failed: 'Processing failed',
    queued: 'Queued…',
    readyHint: 'Your document is indexed. Open it to start asking questions.',
    openDoc: 'Open document',
    addAnother: 'Upload another',
    done: 'Done',
    errorFallback: "We couldn't upload that file.",
    encrypted: 'Processed locally, never used to train models.',
  },
  doc: {
    back: 'Library',
    pagesIndexed: 'pages indexed',
    summary: 'Summary',
    noSummary: 'No summary available yet.',
    download: 'Download',
    reprocess: 'Reprocess',
    reprocessing: 'Reprocessing…',
    delete: 'Delete',
    deleteConfirm: 'Delete this document and all its conversations? This cannot be undone.',
    notIndexed: 'This document is still being processed.',
    page: 'Page',
    loadError: "We couldn't load this document.",
    mode: 'Answer mode',
  },
  chat: {
    title: 'Ask this document',
    placeholder: 'Ask anything about this document…',
    send: 'Send',
    suggested: 'Suggested',
    thinking: 'Searching the document…',
    sources: 'Sources',
    copy: 'Copy',
    copied: 'Copied',
    you: 'You',
    newChat: 'New chat',
    emptyTitle: 'Ask your first question',
    emptyHint: 'Answers cite the exact page — hover a citation to highlight it in the document.',
    errorAnswer: "We couldn't generate an answer. Please try again.",
    viewerHint: 'Hover a citation to highlight its source on the left.',
  },
  convos: {
    title: 'Conversations',
    new: 'New chat',
    rename: 'Rename',
    renameTitle: 'Rename conversation',
    delete: 'Delete',
    deleteConfirm: 'Delete this conversation?',
    empty: 'No conversations yet.',
    messages: 'messages',
    current: 'Current',
  },
  demo: {
    badge: 'Your role',
    panelTitle: 'How to explore',
    crossRoleTitle: 'See RBAC live',
    crossRole:
      'Open a second tab signed in as the Viewer: same indexed library, same cited answers — but no upload, reprocess, or delete.',
    canOwner: 'As Owner you can upload, reprocess, delete, and ask.',
    canViewer: 'As Viewer you can read and ask — uploads and edits are disabled.',
    cannotViewer: 'Owner-only',
    replay: 'Replay tour',
    next: 'Next',
    back: 'Back',
    gotIt: 'Got it',
    skip: 'Skip',
    step: 'Step',
    of: 'of',
    steps: [
      {
        title: 'Welcome to DocuMind',
        body: 'Open a document and ask it anything — answers come back grounded in the text, with citations to the exact page.',
      },
      {
        title: 'Citations you can verify',
        body: 'Every answer cites its source. Hover a citation chip to highlight the exact passage in the document on the left.',
      },
      {
        title: 'Role-aware access',
        body: 'Your role badge sits in the header. Owners upload and manage documents; Viewers read and ask. Try opening a second tab as the Viewer.',
      },
    ],
  },
};

const ES: AppCopy = {
  header: { library: 'Biblioteca', signOut: 'Cerrar sesión' },
  footer: {
    tagline: 'Pregunta a tus documentos. Obtén respuestas con citas.',
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
    viewerNoUpload: 'Solo los Propietarios pueden subir — abre cualquier documento para preguntar.',
  },
  upload: {
    title: 'Subir un documento',
    drop: 'Arrastra un archivo aquí',
    or: 'o',
    choose: 'Elegir archivo',
    accept: 'PDF, TXT o Markdown',
    maxSize: 'hasta 15 MB',
    uploading: 'Subiendo…',
    processing: 'Indexando — extrayendo y embebiendo páginas',
    indexed: 'Indexado y listo para preguntas',
    failed: 'Falló el procesamiento',
    queued: 'En cola…',
    readyHint: 'Tu documento está indexado. Ábrelo para empezar a preguntar.',
    openDoc: 'Abrir documento',
    addAnother: 'Subir otro',
    done: 'Listo',
    errorFallback: 'No pudimos subir ese archivo.',
    encrypted: 'Procesado localmente, nunca se usa para entrenar modelos.',
  },
  doc: {
    back: 'Biblioteca',
    pagesIndexed: 'páginas indexadas',
    summary: 'Resumen',
    noSummary: 'Aún no hay resumen disponible.',
    download: 'Descargar',
    reprocess: 'Reprocesar',
    reprocessing: 'Reprocesando…',
    delete: 'Eliminar',
    deleteConfirm: '¿Eliminar este documento y todas sus conversaciones? No se puede deshacer.',
    notIndexed: 'Este documento aún se está procesando.',
    page: 'Página',
    loadError: 'No pudimos cargar este documento.',
    mode: 'Modo de respuesta',
  },
  chat: {
    title: 'Pregunta a este documento',
    placeholder: 'Pregunta lo que quieras sobre este documento…',
    send: 'Enviar',
    suggested: 'Sugeridas',
    thinking: 'Buscando en el documento…',
    sources: 'Fuentes',
    copy: 'Copiar',
    copied: 'Copiado',
    you: 'Tú',
    newChat: 'Nuevo chat',
    emptyTitle: 'Haz tu primera pregunta',
    emptyHint: 'Las respuestas citan la página exacta — pasa el cursor sobre una cita para resaltarla en el documento.',
    errorAnswer: 'No pudimos generar una respuesta. Inténtalo de nuevo.',
    viewerHint: 'Pasa el cursor sobre una cita para resaltar su fuente a la izquierda.',
  },
  convos: {
    title: 'Conversaciones',
    new: 'Nuevo chat',
    rename: 'Renombrar',
    renameTitle: 'Renombrar conversación',
    delete: 'Eliminar',
    deleteConfirm: '¿Eliminar esta conversación?',
    empty: 'Aún no hay conversaciones.',
    messages: 'mensajes',
    current: 'Actual',
  },
  demo: {
    badge: 'Tu rol',
    panelTitle: 'Cómo explorar',
    crossRoleTitle: 'Ve el RBAC en vivo',
    crossRole:
      'Abre otra pestaña con la cuenta de Lector: la misma biblioteca indexada, las mismas respuestas citadas — pero sin subir, reprocesar ni eliminar.',
    canOwner: 'Como Propietario puedes subir, reprocesar, eliminar y preguntar.',
    canViewer: 'Como Lector puedes leer y preguntar — subir y editar están deshabilitados.',
    cannotViewer: 'Solo Propietario',
    replay: 'Repetir tour',
    next: 'Siguiente',
    back: 'Atrás',
    gotIt: 'Entendido',
    skip: 'Saltar',
    step: 'Paso',
    of: 'de',
    steps: [
      {
        title: 'Bienvenido a DocuMind',
        body: 'Abre un documento y pregúntale lo que sea — las respuestas se fundamentan en el texto, con citas a la página exacta.',
      },
      {
        title: 'Citas que puedes verificar',
        body: 'Cada respuesta cita su fuente. Pasa el cursor sobre una cita para resaltar el pasaje exacto en el documento de la izquierda.',
      },
      {
        title: 'Acceso según tu rol',
        body: 'Tu badge de rol está en el header. Los Propietarios suben y gestionan documentos; los Lectores leen y preguntan. Prueba abrir otra pestaña como Lector.',
      },
    ],
  },
};

export const COPY: Record<Lang, AppCopy> = { en: EN, es: ES };
