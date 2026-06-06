import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { createNotification } from '../notifications/notification.service';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getVerifiedNGOById = async (ngoId: string) => {
  const ngo = await prisma.nGO.findUnique({ where: { id: ngoId } });
  if (!ngo) throw new AppError('NGO not found', 404);
  if (!ngo.isVerified) throw new AppError('You can only donate to verified NGOs', 400);
  return ngo;
};

const getNGOByUserId = async (userId: string) => {
  const ngo = await prisma.nGO.findFirst({ where: { userId } });
  if (!ngo) throw new AppError('NGO profile not found for this account', 404);
  return ngo;
};

// ─── Public: List verified NGOs ──────────────────────────────────────────────

export const getVerifiedNGOs = async () => {
  return prisma.nGO.findMany({
    where: { isVerified: true },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      description: true,
      account: { select: { totalRaised: true } },
    },
    orderBy: { name: 'asc' },
  });
};

// ─── Resource Donations ──────────────────────────────────────────────────────

export const createResourceDonation = async (
  citizenId: string,
  data: {
    ngoId: string;
    itemName: string;
    category: string;
    quantity: number;
    unit?: string;
    description?: string;
  }
) => {
  const ngo = await getVerifiedNGOById(data.ngoId);

  const donation = await prisma.resourceDonation.create({
    data: { citizenId, ...data },
    include: {
      ngo: { select: { name: true } },
      citizen: { select: { firstName: true, lastName: true } },
    },
  });

  // Notify the NGO admin
  createNotification(
    ngo.userId,
    'RESOURCE_DONATION',
    'New Resource Donation Offer',
    `${donation.citizen.firstName} ${donation.citizen.lastName} wants to donate ` +
    `${data.quantity}${data.unit ? ' ' + data.unit : ''} of "${data.itemName}" to ${ngo.name}.`
  ).catch(() => {});

  return donation;
};

export const getMyResourceDonations = async (citizenId: string) => {
  return prisma.resourceDonation.findMany({
    where: { citizenId },
    include: {
      ngo: { select: { name: true, city: true, state: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getNGOIncomingResourceDonations = async (userId: string) => {
  const ngo = await getNGOByUserId(userId);
  return prisma.resourceDonation.findMany({
    where: { ngoId: ngo.id },
    include: {
      citizen: {
        select: { firstName: true, lastName: true, email: true, phone: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const respondToResourceDonation = async (
  donationId: string,
  userId: string,
  status: string,
  ngoNote?: string
) => {
  const validStatuses = ['ACCEPTED', 'REJECTED', 'RECEIVED'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Status must be one of: ${validStatuses.join(', ')}`, 400);
  }

  const ngo = await getNGOByUserId(userId);
  const donation = await prisma.resourceDonation.findUnique({ where: { id: donationId } });
  if (!donation) throw new AppError('Donation not found', 404);
  if (donation.ngoId !== ngo.id) throw new AppError('Not authorised to respond to this donation', 403);
  if (donation.status === 'RECEIVED') throw new AppError('This donation is already marked as received', 400);

  const updated = await prisma.resourceDonation.update({
    where: { id: donationId },
    data: { status, ngoNote: ngoNote ?? null, respondedAt: new Date() },
  });

  // Notify citizen
  const msgs: Record<string, string> = {
    ACCEPTED: `Great news! ${ngo.name} has accepted your donation of "${donation.itemName}". They will contact you to arrange pickup/delivery.`,
    REJECTED: `${ngo.name} is unable to accept your donation of "${donation.itemName}" at this time. Thank you for your generosity.`,
    RECEIVED: `${ngo.name} has confirmed receiving your donation of "${donation.itemName}". Thank you so much! 🙏`,
  };

  createNotification(donation.citizenId, 'DONATION_UPDATE', 'Donation Update', msgs[status]).catch(() => {});

  return updated;
};

// ─── Money Donations ─────────────────────────────────────────────────────────

export const createMoneyDonation = async (
  citizenId: string,
  data: { ngoId: string; amount: number; message?: string }
) => {
  if (!data.amount || data.amount <= 0) throw new AppError('Donation amount must be greater than 0', 400);

  const ngo = await getVerifiedNGOById(data.ngoId);

  // Create donation + upsert NGO account — atomically
  const [donation] = await prisma.$transaction([
    prisma.moneyDonation.create({
      data: { citizenId, ...data },
      include: {
        ngo: { select: { name: true } },
        citizen: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.nGOAccount.upsert({
      where: { ngoId: data.ngoId },
      update: {
        balance: { increment: data.amount },
        totalRaised: { increment: data.amount },
      },
      create: {
        ngoId: data.ngoId,
        balance: data.amount,
        totalRaised: data.amount,
        totalSpent: 0,
      },
    }),
  ]);

  // Notify NGO admin
  createNotification(
    ngo.userId,
    'MONEY_DONATION',
    '💰 New Donation Received',
    `You received a donation of ₹${data.amount.toLocaleString('en-IN')} for ${ngo.name}.` +
    (data.message ? ` Message: "${data.message}"` : '')
  ).catch(() => {});

  return donation;
};

export const getMyMoneyDonations = async (citizenId: string) => {
  return prisma.moneyDonation.findMany({
    where: { citizenId },
    include: {
      ngo: { select: { name: true, city: true, state: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ─── NGO Accounts ────────────────────────────────────────────────────────────

export const getNGOAccountOverview = async (userId: string) => {
  const ngo = await getNGOByUserId(userId);

  // Ensure account exists
  const account = await prisma.nGOAccount.upsert({
    where: { ngoId: ngo.id },
    update: {},
    create: { ngoId: ngo.id, balance: 0, totalRaised: 0, totalSpent: 0 },
  });

  const [recentDonations, recentExpenses, donationCount] = await Promise.all([
    prisma.moneyDonation.findMany({
      where: { ngoId: ngo.id },
      include: { citizen: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.nGOExpense.findMany({
      where: { ngoId: ngo.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.moneyDonation.count({ where: { ngoId: ngo.id } }),
  ]);

  return {
    ngo: { id: ngo.id, name: ngo.name },
    account,
    recentDonations,
    recentExpenses,
    donationCount,
  };
};

export const recordExpense = async (
  userId: string,
  data: { amount: number; category: string; description: string }
) => {
  if (!data.amount || data.amount <= 0) throw new AppError('Expense amount must be greater than 0', 400);
  if (!data.description?.trim()) throw new AppError('Description is required', 400);

  const ngo = await getNGOByUserId(userId);

  const account = await prisma.nGOAccount.findUnique({ where: { ngoId: ngo.id } });
  if (!account || account.balance < data.amount) {
    throw new AppError(
      `Insufficient balance. Current balance: ₹${(account?.balance ?? 0).toLocaleString('en-IN')}`,
      400
    );
  }

  const [expense] = await prisma.$transaction([
    prisma.nGOExpense.create({
      data: { ngoId: ngo.id, recordedBy: userId, ...data },
    }),
    prisma.nGOAccount.update({
      where: { ngoId: ngo.id },
      data: {
        balance: { decrement: data.amount },
        totalSpent: { increment: data.amount },
      },
    }),
  ]);

  return expense;
};

export const getAccountHistory = async (userId: string) => {
  const ngo = await getNGOByUserId(userId);

  const [donations, expenses] = await Promise.all([
    prisma.moneyDonation.findMany({
      where: { ngoId: ngo.id },
      include: { citizen: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.nGOExpense.findMany({
      where: { ngoId: ngo.id },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { donations, expenses };
};
