export function transformDoc<T>(doc: object): T {
  const { _id, __v, ...rest } = doc as Record<string, unknown>;
  return { ...rest, id: _id } as T;
}
