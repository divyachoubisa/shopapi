export function getPagination(req) {
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(100, parseInt(req.query.limit || "10"));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
export function getPaginationMeta(total, params) {
    const totalPages = Math.ceil(total / params.limit);
    return {
        total,
        page: params.page,
        limit: params.limit,
        totalPages,
        hasNext: params.page < totalPages,
        hasPrev: params.page > 1,
    };
}
