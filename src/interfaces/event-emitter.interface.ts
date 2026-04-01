export interface EventEmitterLike {
  emit(event: string | string[], ...values: unknown[]): boolean;
}
