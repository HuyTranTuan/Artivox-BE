const { prisma } = require("@libs/prisma");
const { HTTP_CODES } = require("@/config/constants");

// GET /comments?entityType=PRODUCT&entityId=123&page=1&limit=10
const getComments = async (req, res) => {
  try {
    const { entityType, entityId, page = 1, limit = 10 } = req.query;
    if (!entityType || !entityId) {
      return res.error("entityType and entityId required", HTTP_CODES.BAD_REQUESTED);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { entityType, entityId: BigInt(entityId), deletedAt: null },
        include: {
          customer: { select: { id: true, fullName: true, avatar: true, slug: true, verifiedAt: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
      }),
      prisma.comment.count({ where: { entityType, entityId: BigInt(entityId), deletedAt: null } }),
    ]);
    return res.success({ comments: comments.map(c => ({ ...c, id: c.id.toString(), customerId: c.customerId.toString(), entityId: c.entityId.toString(), customer: { ...c.customer, id: c.customer.id.toString() } })), total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return res.error(err.message, HTTP_CODES.INTERNAL_SERVER_ERROR);
  }
};

// POST /comments  (auth required)
const createComment = async (req, res) => {
  try {
    const customerId = req.user?.id;
    if (!customerId) return res.error("Unauthorized", HTTP_CODES.UNAUTHORIZED);
    const { entityType, entityId, content, rating } = req.body;
    if (!entityType || !entityId || !content?.trim()) {
      return res.error("entityType, entityId, content required", HTTP_CODES.BAD_REQUESTED);
    }
    // only verified customers
    const customer = await prisma.customer.findUnique({ where: { id: BigInt(customerId) } });
    if (!customer?.verifiedAt) return res.error("Only verified customers can comment", HTTP_CODES.FORBIDDEN);

    const comment = await prisma.comment.create({
      data: {
        customerId: BigInt(customerId),
        entityType,
        entityId: BigInt(entityId),
        content: content.trim(),
        rating: rating ? Number(rating) : null,
      },
      include: {
        customer: { select: { id: true, fullName: true, avatar: true, slug: true, verifiedAt: true } },
      },
    });
    return res.success({ ...comment, id: comment.id.toString(), customerId: comment.customerId.toString(), entityId: comment.entityId.toString(), customer: { ...comment.customer, id: comment.customer.id.toString() } }, HTTP_CODES.CREATED);
  } catch (err) {
    return res.error(err.message, HTTP_CODES.INTERNAL_SERVER_ERROR);
  }
};

// DELETE /comments/:id  (owner only)
const deleteComment = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id: BigInt(id) } });
    if (!comment) return res.error("Not found", HTTP_CODES.NOT_FOUND);
    if (comment.customerId.toString() !== customerId.toString()) return res.error("Forbidden", HTTP_CODES.FORBIDDEN);
    await prisma.comment.update({ where: { id: BigInt(id) }, data: { deletedAt: new Date() } });
    return res.success({ message: "Deleted" });
  } catch (err) {
    return res.error(err.message, HTTP_CODES.INTERNAL_SERVER_ERROR);
  }
};

module.exports = { getComments, createComment, deleteComment };
