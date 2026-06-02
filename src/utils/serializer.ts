import { Decimal } from "@prisma/client/runtime/client";

export function serialize<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (data instanceof Decimal) {
    return Number(Number(data).toFixed(2)) as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map(serialize) as unknown as T;
  }
  if (typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, serialize(value)]),
    ) as T;
  }
  return data;
}
