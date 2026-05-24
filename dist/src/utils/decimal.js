export function toNumber(value) {
    if (value == null)
        return 0;
    return typeof value === "number" ? value : Number(value);
}
export function roundMoney(value) {
    return Math.round(value * 100) / 100;
}
