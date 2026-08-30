export class RevisionConflictError extends Error {
  constructor(public readonly currentRevision: number) {
    super("El proyecto cambió desde la última lectura.");
    this.name = "RevisionConflictError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Recurso no encontrado.") {
    super(message);
    this.name = "NotFoundError";
  }
}
