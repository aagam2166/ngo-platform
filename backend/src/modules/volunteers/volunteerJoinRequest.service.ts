import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { createNotification } from '../notifications/notification.service';

// ── Volunteer sends a join request to an NGO ──────────────────────────────

export const sendJoinRequest = async (
  userId: string,
  ngoId: string,
  message?: string
) => {
  const volunteer = await prisma.volunteer.findUnique({ where: { userId } });
  if (!volunteer) throw new AppError('Volunteer profile not found', 404);

  const ngo = await prisma.nGO.findUnique({ where: { id: ngoId } });
  if (!ngo) throw new AppError('NGO not found', 404);

  // Check if already on roster
  const alreadyMember = await prisma.nGOVolunteer.findUnique({
    where: { ngoId_volunteerId: { ngoId, volunteerId: volunteer.id } },
  });
  if (alreadyMember?.isActive) {
    throw new AppError('You are already a member of this NGO', 400);
  }

  // Check if there is already a pending request
  const existing = await prisma.volunteerJoinRequest.findUnique({
    where: { volunteerId_ngoId: { volunteerId: volunteer.id, ngoId } },
  });

  if (existing) {
    if (existing.status === 'PENDING') {
      throw new AppError('You already have a pending request to join this NGO', 400);
    }
    // Allow re-applying if previously rejected or withdrawn
    return prisma.volunteerJoinRequest.update({
      where: { volunteerId_ngoId: { volunteerId: volunteer.id, ngoId } },
      data: { status: 'PENDING', message, respondedAt: null },
      include: { ngo: { select: { name: true, city: true } } },
    });
  }

  return prisma.volunteerJoinRequest.create({
    data: { volunteerId: volunteer.id, ngoId, message },
    include: { ngo: { select: { name: true, city: true } } },
  });
};

// ── Volunteer sees their own join requests ────────────────────────────────

export const getMyJoinRequests = async (userId: string) => {
  const volunteer = await prisma.volunteer.findUnique({ where: { userId } });
  if (!volunteer) throw new AppError('Volunteer profile not found', 404);

  return prisma.volunteerJoinRequest.findMany({
    where: { volunteerId: volunteer.id },
    include: {
      ngo: { select: { name: true, city: true, state: true, isVerified: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ── Volunteer withdraws their join request ────────────────────────────────

export const withdrawJoinRequest = async (
  requestId: string,
  userId: string
) => {
  const volunteer = await prisma.volunteer.findUnique({ where: { userId } });
  if (!volunteer) throw new AppError('Volunteer profile not found', 404);

  const joinRequest = await prisma.volunteerJoinRequest.findUnique({
    where: { id: requestId },
  });
  if (!joinRequest) throw new AppError('Join request not found', 404);
  if (joinRequest.volunteerId !== volunteer.id) {
    throw new AppError('This is not your join request', 403);
  }
  if (joinRequest.status !== 'PENDING') {
    throw new AppError('Only pending requests can be withdrawn', 400);
  }

  return prisma.volunteerJoinRequest.update({
    where: { id: requestId },
    data: { status: 'WITHDRAWN', respondedAt: new Date() },
  });
};

// ── Volunteer leaves an NGO roster on their own (Issue #3) ───────────────

export const leaveNGORoster = async (userId: string, ngoId: string) => {
  const volunteer = await prisma.volunteer.findUnique({ where: { userId } });
  if (!volunteer) throw new AppError('Volunteer profile not found', 404);

  const membership = await prisma.nGOVolunteer.findUnique({
    where: { ngoId_volunteerId: { ngoId, volunteerId: volunteer.id } },
  });
  if (!membership || !membership.isActive) {
    throw new AppError('You are not a member of this NGO', 404);
  }

  await prisma.nGOVolunteer.update({
    where: { ngoId_volunteerId: { ngoId, volunteerId: volunteer.id } },
    data: { isActive: false },
  });

  return { message: 'You have left the NGO roster' };
};

// ── NGO sees incoming join requests ──────────────────────────────────────

export const getNGOJoinRequests = async (ngoId: string, status?: string) => {
  return prisma.volunteerJoinRequest.findMany({
    where: {
      ngoId,
      ...(status ? { status } : { status: 'PENDING' }),
    },
    include: {
      volunteer: {
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true, phone: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
};

// ── NGO approves a join request ───────────────────────────────────────────

export const approveJoinRequest = async (
  requestId: string,
  ngoId: string
) => {
  const joinRequest = await prisma.volunteerJoinRequest.findUnique({
    where: { id: requestId },
    include: {
      volunteer: true,
      ngo: { select: { name: true } },
    },
  });
  if (!joinRequest) throw new AppError('Join request not found', 404);
  if (joinRequest.ngoId !== ngoId) throw new AppError('Forbidden', 403);
  if (joinRequest.status !== 'PENDING') {
    throw new AppError('Only pending requests can be approved', 400);
  }

  await prisma.volunteerJoinRequest.update({
    where: { id: requestId },
    data: { status: 'APPROVED', respondedAt: new Date() },
  });

  createNotification(
    joinRequest.volunteer.userId,
    'JOIN_REQUEST_APPROVED',
    'Join Request Approved',
    `Your request to join ${joinRequest.ngo.name} has been approved. You are now on their roster.`
  ).catch(() => {});

  // Add to roster (or reactivate)
  const existingMembership = await prisma.nGOVolunteer.findUnique({
    where: {
      ngoId_volunteerId: {
        ngoId,
        volunteerId: joinRequest.volunteerId,
      },
    },
  });

  if (existingMembership) {
    return prisma.nGOVolunteer.update({
      where: {
        ngoId_volunteerId: {
          ngoId,
          volunteerId: joinRequest.volunteerId,
        },
      },
      data: { isActive: true },
      include: {
        volunteer: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
  }

  return prisma.nGOVolunteer.create({
    data: { ngoId, volunteerId: joinRequest.volunteerId },
    include: {
      volunteer: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
    },
  });
};

// ── NGO rejects a join request ────────────────────────────────────────────

export const rejectJoinRequest = async (
  requestId: string,
  ngoId: string
) => {
  const joinRequest = await prisma.volunteerJoinRequest.findUnique({
    where: { id: requestId },
    include: {
      volunteer: true,
      ngo: { select: { name: true } },
    },
  });
  if (!joinRequest) throw new AppError('Join request not found', 404);
  if (joinRequest.ngoId !== ngoId) throw new AppError('Forbidden', 403);
  if (joinRequest.status !== 'PENDING') {
    throw new AppError('Only pending requests can be rejected', 400);
  }

  const result = await prisma.volunteerJoinRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED', respondedAt: new Date() },
  });

  createNotification(
    joinRequest.volunteer.userId,
    'JOIN_REQUEST_REJECTED',
    'Join Request Declined',
    `Your request to join ${joinRequest.ngo.name} was not accepted at this time.`
  ).catch(() => {});

  return result;
};