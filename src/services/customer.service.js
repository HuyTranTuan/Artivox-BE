const { prisma } = require("@libs/prisma");

// Fetch all customers.
async function getCustomers() {
  return prisma.customer.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      address: true,
      slug: true,
      dateOfBirth: true,
      gender: true,
      verifiedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc", deletedAt: null },
  });
}

//Fetch a single customer by slug.
async function getCustomerBySlug(slug) {
  return prisma.customer.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      address: true,
      slug: true,
      dateOfBirth: true,
      gender: true,
      verifiedAt: true,
      createdAt: true,
    },
  });
}

//Fetch a single customer by email.
async function getCustomerByEmail(email) {
  return prisma.customer.findFirst({
    where: { email, deletedAt: null },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      address: true,
      slug: true,
      dateOfBirth: true,
      gender: true,
      verifiedAt: true,
      createdAt: true,
    },
  });
}

// Block Harnful Customers
async function blockHarmfulCustomer(email) {
  const customer = await prisma.customer.findFirst({
    where: { email, deletedAt: null },
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      address: true,
      slug: true,
      dateOfBirth: true,
      gender: true,
      verifiedAt: true,
      createdAt: true,
    },
  });
  if (!customer) return res;
  await prisma.customer.update({
    where: { email },
    data: { deletedAt: new Date() },
  });
  return;
}

module.exports = { getCustomers, getCustomerBySlug, getCustomerByEmail, blockHarmfulCustomer };
