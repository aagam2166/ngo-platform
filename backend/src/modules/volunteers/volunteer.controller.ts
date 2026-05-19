import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import prisma from '../../config/prisma';
import {
  getNGORoster,
  addVolunteerToRoster,
  removeVolunteerFromRoster,
  getVolunteersForAssignment,
  getAllAvailableVolunteers,
  assignVolunteer,
  getMyAssignments,
  updateAssignmentStatus,
} from './volunteer.service';

// Helper — gets the NGO profile for the currently logged in NGO admin
const getNGOProfile = async (userId: string) => {
  const profile = await prisma.nGO.findUnique({ where: { userId } });
  if (!profile) throw new AppError('NGO profile not found for this user', 404);
  return profile;
};

// ─────────────────────────────────────────────
// ROSTER
// ─────────────────────────────────────────────

export const getNGORosterHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const profile = await getNGOProfile(req.user!.userId);
    const roster = await getNGORoster(profile.id);
    sendSuccess(res, roster);
  } catch (err) { next(err); }
};

export const addToRosterHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const profile = await getNGOProfile(req.user!.userId);
    const entry = await addVolunteerToRoster(
      profile.id,
      req.params.volunteerId as string
    );
    sendSuccess(res, entry, 201);
  } catch (err) { next(err); }
};

export const removeFromRosterHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const profile = await getNGOProfile(req.user!.userId);
    await removeVolunteerFromRoster(profile.id, req.params.volunteerId as string);
    sendSuccess(res, { message: 'Volunteer removed from roster' });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// DISCOVERY
// ─────────────────────────────────────────────

// NGO — sees internal vs external split for assignment picker
export const getVolunteersForAssignmentHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const profile = await getNGOProfile(req.user!.userId);
    const result = await getVolunteersForAssignment(profile.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
};

// Super Admin — sees all available volunteers
export const getAllVolunteersHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const volunteers = await getAllAvailableVolunteers();
    sendSuccess(res, volunteers);
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// ASSIGNMENT
// ─────────────────────────────────────────────

export const assignVolunteerHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requestId, volunteerId, notes } = req.body;

    if (!requestId || !volunteerId) {
      return next(
        new AppError('requestId and volunteerId are both required', 400)
      );
    }

    const profile = await getNGOProfile(req.user!.userId);

    const assignment = await assignVolunteer(
      requestId,
      volunteerId,
      req.user!.userId,
      profile.id,
      notes
    );

    sendSuccess(res, assignment, 201);
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────
// VOLUNTEER'S OWN VIEW
// ─────────────────────────────────────────────

export const getMyAssignmentsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const assignments = await getMyAssignments(req.user!.userId);
    sendSuccess(res, assignments);
  } catch (err) { next(err); }
};

export const updateAssignmentHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.body;
    if (!status) return next(new AppError('Status is required', 400));

    const updated = await updateAssignmentStatus(
      req.params.id as string,
      status,
      req.user!.userId
    );
    sendSuccess(res, updated);
  } catch (err) { next(err); }
};