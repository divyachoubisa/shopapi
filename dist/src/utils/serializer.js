import { Decimal } from "@prisma/client/runtime/client";
export function serialize(data) {
    if (data === null || data === undefined)
        return data;
    if (data instanceof Decimal) {
        return Number(Number(data).toFixed(2));
    }
    if (Array.isArray(data)) {
        return data.map(serialize);
    }
    if (typeof data === "object") {
        return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, serialize(value)]));
    }
    return data;
}
