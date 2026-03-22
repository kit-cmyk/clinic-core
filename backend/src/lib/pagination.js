/**
 * Parse and normalise pagination query params.
 * Returns { page, limit, skip } ready to pass to Prisma findMany.
 *
 * @param {object} query - req.query
 * @param {number} [defaultLimit=20]
 * @param {number} [maxLimit=100]
 */
export function parsePagination(query, defaultLimit = 20, maxLimit = 100) {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build a standard paginated response envelope.
 *
 * @param {Array}  data
 * @param {number} total - total record count (for the filtered query)
 * @param {number} page
 * @param {number} limit
 */
export function paginatedResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
    },
  };
}
