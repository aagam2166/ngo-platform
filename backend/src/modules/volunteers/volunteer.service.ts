import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';

// ─────────────────────────────────────────────
// ROSTER MANAGEMENT
// ─────────────────────────────────────────────

export const getNGORoster = async (ngoId: string) => {
  return prisma.nGOVolunteer.findMany({
    where: { ngoId },
    include: {
      volunteer: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
};

export const addVolunteerToRoster = async (
  ngoId: string,
  volunteerId: string
) => {
  const volunteer = await prisma.volunteer.findUnique({
    where: { id: volunteerId },
  });
  if (!volunteer) throw new AppError('Volunteer not found', 404);

  const existing = await prisma.nGOVolunteer.findUnique({
    where: { ngoId_volunteerId: { ngoId, volunteerId } },
  });

  if (existing) {
    if (existing.isActive) {
      throw new AppError('This volunteer is already on your roster', 400);
    }
    // Reactivate if they were previously removed
    return prisma.nGOVolunteer.update({
      where: { ngoId_volunteerId: { ngoId, volunteerId } },
      data: { isActive: true },
      include: {
        volunteer: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  return prisma.nGOVolunteer.create({
    data: { ngoId, volunteerId },
    include: {
      volunteer: {
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });
};

export const removeVolunteerFromRoster = async (
  ngoId: string,
  volunteerId: string
) => {
  const entry = await prisma.nGOVolunteer.findUnique({
    where: { ngoId_volunteerId: { ngoId, volunteerId } },
  });
  if (!entry) throw new AppError('Volunteer not on your roster', 404);

  return prisma.nGOVolunteer.update({
    where: { ngoId_volunteerId: { ngoId, volunteerId } },
    data: { isActive: false },
  });
};

// ─────────────────────────────────────────────
// VOLUNTEER DISCOVERY (for assignment picker)
// ─────────────────────────────────────────────

export const getVolunteersForAssignment = async (ngoId: string) => {
  // Internal — on this NGO's roster and available
  const rosterEntries = await prisma.nGOVolunteer.findMany({
    where: { ngoId, isActive: true },
    include: {
      volunteer: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  const internal = rosterEntries
    .filter((entry) => entry.volunteer.isAvailable)
    .map((entry) => ({
      ...entry.volunteer,
      source: 'INTERNAL' as const,
    }));

  // External — available volunteers NOT on this NGO's roster
  const internalVolunteerIds = rosterEntries.map((e) => e.volunteerId);

  const externalVolunteers = await prisma.volunteer.findMany({
    where: {
      isAvailable: true,
      id: {
        notIn: internalVolunteerIds.length > 0 ? internalVolunteerIds : [''],
      },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return {
    internal,
    external: externalVolunteers.map((v) => ({
      ...v,
      source: 'EXTERNAL' as const,
    })),
    hasInternal: internal.length > 0,
  };
};

// Admin-only — all available volunteers across the platform
export const getAllAvailableVolunteers = async () => {
  return prisma.volunteer.findMany({
    where: { isAvailable: true },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  });
};

// ─────────────────────────────────────────────
// ASSIGNMENT
// ─────────────────────────────────────────────

export const assignVolunteer = async (
  requestId: string,
  volunteerId: string,
  assignedBy: string,
  ngoId: string,
  notes?: string
) => {
  // Request must exist
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError('Request not found', 404);

  // Request must belong to this NGO
  if (request.ngoId !== ngoId) {
    throw new AppError(
      'You can only assign volunteers to requests belonging to your NGO',
      403
    );
  }

  // Volunteer must exist
  const volunteer = await prisma.volunteer.findUnique({
    where: { id: volunteerId },
  });
  if (!volunteer) throw new AppError('Volunteer not found', 404);

  // No duplicate assignments
  const existing = await prisma.volunteerAssignment.findUnique({
    where: { requestId_volunteerId: { requestId, volunteerId } },
  });
  if (existing) {
    throw new AppError(
      'This volunteer is already assigned to this request',
      400
    );
  }

  // Check if internal or external to this NGO
  const rosterEntry = await prisma.nGOVolunteer.findUnique({
    where: { ngoId_volunteerId: { ngoId, volunteerId } },
  });
  const isInternal = rosterEntry?.isActive ?? false;

  const assignment = await prisma.volunteerAssignment.create({
    data: {
      requestId,
      volunteerId,
      ngoId,
      assignedBy,
      notes: notes
        ? notes
        : isInternal
        ? 'Assigned from NGO roster'
        : 'External volunteer assignment',
    },
    include: {
      volunteer: {
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      },
      request: { select: { title: true, status: true } },
      ngo: { select: { name: true } },
    },
  });

  // Move request to IN_PROGRESS
  await prisma.request.update({
    where: { id: requestId },
    data: { status: 'IN_PROGRESS' },
  });

  return { ...assignment, isInternal };
};

// ─────────────────────────────────────────────
// VOLUNTEER'S OWN ASSIGNMENTS
// ─────────────────────────────────────────────

export const getMyAssignments = async (userId: string) => {
  const volunteer = await prisma.volunteer.findUnique({ where: { userId } });
  // Return empty array if volunteer profile doesn't exist yet
  if (!volunteer) return [];

  return prisma.volunteerAssignment.findMany({
    where: { volunteerId: volunteer.id },
    include: {
      request: {
        include: {
          citizen: {
            select: { firstName: true, lastName: true, phone: true },
          },
        },
      },
      ngo: { select: { name: true, city: true } },
    },
    orderBy: { assignedAt: 'desc' },
  });
};

export const updateAssignmentStatus = async (
  assignmentId: string,
  status: string,
  userId: string
) => {
  const assignment = await prisma.volunteerAssignment.findUnique({
    where: { id: assignmentId },
    include: { volunteer: true },
  });

  if (!assignment) throw new AppError('Assignment not found', 404);

  if (assignment.volunteer.userId !== userId) {
    throw new AppError('You can only update your own assignments', 403);
  }

  const validStatuses = ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];
  if (!validStatuses.includes(status)) {
    throw new AppError(
      `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      400
    );
  }

  return prisma.volunteerAssignment.update({
    where: { id: assignmentId },
    data: { status },
  });
};