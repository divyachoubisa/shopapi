import type { Decimal } from "@prisma/client/runtime/client";

type DecimalLike = Decimal | number | string | null | undefined;

export function toNumber(value: DecimalLike): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
