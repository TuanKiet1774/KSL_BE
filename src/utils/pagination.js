const paginate = async (model, query = {}, options = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
        select = "",
        populate = ""
    } = options;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const results = await model.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select(select)
        .populate(populate);

    const total = await model.countDocuments(query);

    return {
        data: results,
        total,
        pagination: {
            totalPage: Math.ceil(total / limitNum),
            currentPage: pageNum,
            limit: limitNum,
        },
    };
};

module.exports = paginate;
