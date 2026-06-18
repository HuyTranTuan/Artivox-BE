const { prisma } = require("@libs/prisma");
const { HTTP_CODES } = require("@/config/constants");

// GET /shipping-addresses  (my addresses)
const getMyAddresses = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const addresses = await prisma.shippingAddress.findMany({
      where: { customerId: BigInt(customerId) },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return res.success(addresses.map(a => ({ ...a, id: a.id.toString(), customerId: a.customerId.toString() })));
  } catch (err) {
    return res.error(err.message, HTTP_CODES.INTERNAL_SERVER_ERROR);
  }
};

// POST /shipping-addresses
const createAddress = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const { label, fullAddress, provinceCode, wardCode, streetDetail, isDefault } = req.body;
    if (!label || !fullAddress || !provinceCode || !streetDetail) {
      return res.error("label, fullAddress, provinceCode, streetDetail required", HTTP_CODES.BAD_REQUEST);
    }
    if (isDefault) {
      // unset existing default
      await prisma.shippingAddress.updateMany({ where: { customerId: BigInt(customerId), isDefault: true }, data: { isDefault: false } });
    }
    const address = await prisma.shippingAddress.create({
      data: { customerId: BigInt(customerId), label, fullAddress, provinceCode, wardCode: wardCode || null, streetDetail, isDefault: !!isDefault },
    });
    return res.success({ ...address, id: address.id.toString(), customerId: address.customerId.toString() }, HTTP_CODES.CREATED);
  } catch (err) {
    return res.error(err.message, HTTP_CODES.INTERNAL_SERVER_ERROR);
  }
};

// PATCH /shipping-addresses/:id
const updateAddress = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const { id } = req.params;
    const existing = await prisma.shippingAddress.findUnique({ where: { id: BigInt(id) } });
    if (!existing || existing.customerId.toString() !== customerId.toString()) return res.error("Not found", HTTP_CODES.NOT_FOUND);
    const { label, fullAddress, provinceCode, wardCode, streetDetail, isDefault } = req.body;
    if (isDefault) {
      await prisma.shippingAddress.updateMany({ where: { customerId: BigInt(customerId), isDefault: true }, data: { isDefault: false } });
    }
    const updated = await prisma.shippingAddress.update({
      where: { id: BigInt(id) },
      data: { label, fullAddress, provinceCode, wardCode, streetDetail, isDefault: !!isDefault },
    });
    return res.success({ ...updated, id: updated.id.toString(), customerId: updated.customerId.toString() });
  } catch (err) {
    return res.error(err.message, HTTP_CODES.INTERNAL_SERVER_ERROR);
  }
};

// DELETE /shipping-addresses/:id
const deleteAddress = async (req, res) => {
  try {
    const customerId = req.user?.id;
    const { id } = req.params;
    const existing = await prisma.shippingAddress.findUnique({ where: { id: BigInt(id) } });
    if (!existing || existing.customerId.toString() !== customerId.toString()) return res.error("Not found", HTTP_CODES.NOT_FOUND);
    await prisma.shippingAddress.delete({ where: { id: BigInt(id) } });
    return res.success({ message: "Deleted" });
  } catch (err) {
    return res.error(err.message, HTTP_CODES.INTERNAL_SERVER_ERROR);
  }
};

module.exports = { getMyAddresses, createAddress, updateAddress, deleteAddress };
