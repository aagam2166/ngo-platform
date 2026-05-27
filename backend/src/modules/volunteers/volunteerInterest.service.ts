import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import { createNotification } from '../notifications/notification.service';

// ── Get requests a volunteer can express interest in ──────────────────────

export const getOpenRequests = async (userId: string) => {
  const volunteer = await prisma.volunteer.findUnique({ where: { userId } });
  if (!volunteer) throw new AppError('Volunteer profile not found', 404);

  // Get requests the volunteer is already assigned to
  const alreadyAssigned = await prisma.volunteerAssignment.findMany({
    where: { volunteerId: volunteer.id },
    select: { requestId: true },
  });
  const assignedRequestIds = alreadyAssigned.map((a) => a.requestId);

  // Get requests the volunteer has already expressed interest in
  const alreadyInterested = await prisma.volunteerInterest.findMany({
    where: {
      volunteerId: volunteer.id,
      status: { in: ['PENDING', 'APPROVED'] },
    },
    select: { requestId: true },
  });
  const interestedRequestIds = alreadyInterested.map((i) => i.requestId);

  const excludeIds = [...new Set([...assignedRequestIds, ...interestedRequestIds])];

  // Return APPROVED requests (NGO has accepted, needs a volunteer)
  return prisma.request.findMany({
    where: {
      status: 'APPROVED',
      id: { notIn: excludeIds.length > 0 ? excludeIds : [''] },
    },
    include: {
      ngo: { select: { name: true, city: true, state: true } },
    },
    orderBy: [{ urgencyLevel: 'desc' }, { createdAt: 'asc' }],
  });
};

// ── Volunteer expresses interest in a request ─────────────────────────────

export const expressInterest = async (
  userId: string,
  requestId: string,
  message?: string
) => {
  const volunteer = await prisma.volunteer.findUnique({ where: { userId } });
  if (!volunteer) throw new AppError('Volunteer profile not found', 404);

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { ngo: true },
  });
  if (!request) throw new AppError('Request not found', 404);
  if (!request.ngoId) {
    throw new AppError('This request has not been accepted by an NGO yet', 400);
  }
  if (!['APPROVED', 'UNDER_REVIEW'].includes(request.status)) {
    throw new AppError(
      'You can only express interest in APPROVED or UNDER_REVIEW requests',
      400
    );
  }

  // Check already assigned
  const alreadyAssigned = await prisma.volunteerAssignment.findUnique({
    where: {
      requestId_volunteerId: { requestId, volunteerId: volunteer.id },
    },
  });
  if (alreadyAssigned) {
    throw new AppError('You are already assigned to this request', 400);
  }

  // Check duplicate interest
  const existing = await prisma.volunteerInterest.findUnique({
    where: { volunteerId_requestId: { volunteerId: volunteer.id, requestId } },
  });

  if (existing) {
    if (existing.status === 'PENDING') {
      throw new AppError('You have already expressed interest in this request', 400);
    }
    // Allow re-applying if previously rejected or withdrawn
    return prisma.volunteerInterest.update({
      where: {
        volunteerId_requestId: { volunteerId: volunteer.id, requestId },
      },
      data: { status: 'PENDING', message: message?.trim()||null, respondedAt: null },
      include: {
        request: { select: { title: true, status: true } },
        ngo: { select: { name: true } },
      },
    });
  }

  return prisma.volunteerInterest.create({
    data: {
      volunteerId: volunteer.id,
      requestId,
      ngoId: request.ngoId,
      message: message?.trim() || null,
    },
    include: {
      request: { select: { title: true, status: true } },
      ngo: { select: { name: true } },
    },
  });
};

// ── Volunteer sees their own interest requests ────────────────────────────

export const getMyInterests = async (userId: string) => {
  const volunteer = await prisma.volunteer.findUnique({ where: { userId } });
  if (!volunteer) throw new AppError('Volunteer profile not found', 404);

  return prisma.volunteerInterest.findMany({
    where: { volunteerId: volunteer.id },
    include: {
      request: {
        select: { title: true, category: true, status: true, city: true, state: true },
      },
      ngo: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// ── Volunteer withdraws interest ──────────────────────────────────────────

export const withdrawInterest = async (
  interestId: string,
  userId: string
) => {
  const volunteer = await prisma.volunteer.findUnique({ where: { userId } });
  if (!volunteer) throw new AppError('Volunteer profile not found', 404);

  const interest = await prisma.volunteerInterest.findUnique({
    where: { id: interestId },
  });
  if (!interest) throw new AppError('Interest not found', 404);
  if (interest.volunteerId !== volunteer.id) {
    throw new AppError('This is not your interest request', 403);
  }
  if (interest.status !== 'PENDING') {
    throw new AppError('Only pending interests can be withdrawn', 400);
  }

  return prisma.volunteerInterest.update({
    where: { id: interestId },
    data: { status: 'WITHDRAWN', respondedAt: new Date() },
  });
};

// ── NGO sees volunteer interests for their requests ───────────────────────

export const getNGOInterests = async (ngoId: string, status?: string) => {
  return prisma.volunteerInterest.findMany({
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
      request: {
        select: { title: true, category: true, urgencyLevel: true, city: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
};

// ── NGO approves volunteer interest → creates assignment ──────────────────

export const approveInterest = async (
  interestId: string,
  ngoId: string,
  assignedBy: string
) => {
  const interest = await prisma.volunteerInterest.findUnique({
    where: { id: interestId },
    include: {
      request: true,
      volunteer: true,
      ngo: { select: { name: true } },
    },
  });
  if (!interest) throw new AppError('Interest not found', 404);
  if (interest.ngoId !== ngoId) throw new AppError('Forbidden', 403);
  if (interest.status !== 'PENDING') {
    throw new AppError('Only pending interests can be approved', 400);
  }

  // Check not already assigned
  const alreadyAssigned = await prisma.volunteerAssignment.findUnique({
    where: {
      requestId_volunteerId: {
        requestId: interest.requestId,
        volunteerId: interest.volunteerId,
      },
    },
  });
  if (alreadyAssigned) {
    throw new AppError('Volunteer is already assigned to this request', 400);
  }

  // Check if volunteer is on this NGO's roster
  const rosterEntry = await prisma.nGOVolunteer.findUnique({
    where: {
      ngoId_volunteerId: { ngoId, volunteerId: interest.volunteerId },
    },
  });
  const isInternal = rosterEntry?.isActive ?? false;

  // Mark interest as approved
  await prisma.volunteerInterest.update({
    where: { id: interestId },
    data: { status: 'APPROVED', respondedAt: new Date() },
  });

  // Create the assignment
  const assignment = await prisma.volunteerAssignment.create({
    data: {
      requestId: interest.requestId,
      volunteerId: interest.volunteerId,
      ngoId,
      assignedBy,
      notes: 'Assigned via volunteer interest request',
    },
    include: {
      volunteer: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      },
      request: { select: { title: true } },
    },
  });

  // Move request to IN_PROGRESS
  await prisma.request.update({
    where: { id: interest.requestId },
    data: { status: 'IN_PROGRESS' },
  });

  createNotification(
    interest.volunteer.userId,
    'INTEREST_APPROVED',
    'You Have Been Assigned',
    `${interest.ngo.name} has assigned you to help with "${interest.request.title}".`
  ).catch(() => {});

  return { ...assignment, isInternal };
};

// ── NGO rejects volunteer interest ────────────────────────────────────────

export const rejectInterest = async (
  interestId: string,
  ngoId: string
) => {
  const interest = await prisma.volunteerInterest.findUnique({
    where: { id: interestId },
    include: {
      volunteer: true,
      request: { select: { title: true } },
      ngo: { select: { name: true } },
    },
  });
  if (!interest) throw new AppError('Interest not found', 404);
  if (interest.ngoId !== ngoId) throw new AppError('Forbidden', 403);
  if (interest.status !== 'PENDING') {
    throw new AppError('Only pending interests can be rejected', 400);
  }

  const result = await prisma.volunteerInterest.update({
    where: { id: interestId },
    data: { status: 'REJECTED', respondedAt: new Date() },
  });

  createNotification(
    interest.volunteer.userId,
    'INTEREST_REJECTED',
    'Interest Not Accepted',
    `${interest.ngo.name} could not accept your offer to help with "${interest.request.title}" at this time.`
  ).catch(() => {});

  return result;
};