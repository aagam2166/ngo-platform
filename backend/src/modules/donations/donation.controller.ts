import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authenticate';
import { sendSuccess } from '../../utils/apiResponse';
import {
  getVerifiedNGOs,
  createResourceDonation,
  getMyResourceDonations,
  getNGOIncomingResourceDonations,
  respondToResourceDonation,
  createMoneyDonation,
  getMyMoneyDonations,
  getNGOAccountOverview,
  recordExpense,
  getAccountHistory,
} from './donation.service';

// ─── Public ──────────────────────────────────────────────────────────────────

export const getVerifiedNGOsHandler = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const ngos = await getVerifiedNGOs();
    sendSuccess(res, ngos);
  } catch (err) { next(err); }
};

// ─── Resource Donations ──────────────────────────────────────────────────────

export const createResourceDonationHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ngoId, itemName, category, quantity, unit, description } = req.body;
    const donation = await createResourceDonation(req.user!.userId, {
      ngoId, itemName, category, quantity: Number(quantity), unit, description,
    });
    sendSuccess(res, donation, 201);
  } catch (err) { next(err); }
};

export const getMyResourceDonationsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const donations = await getMyResourceDonations(req.user!.userId);
    sendSuccess(res, donations);
  } catch (err) { next(err); }
};

export const getNGOResourceDonationsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const donations = await getNGOIncomingResourceDonations(req.user!.userId);
    sendSuccess(res, donations);
  } catch (err) { next(err); }
};

export const respondToResourceDonationHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, ngoNote } = req.body;
    const donation = await respondToResourceDonation(
      req.params.id as string,
      req.user!.userId,
      status,
      ngoNote
    );
    sendSuccess(res, donation);
  } catch (err) { next(err); }
};

// ─── Money Donations ─────────────────────────────────────────────────────────

export const createMoneyDonationHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ngoId, amount, message } = req.body;
    const donation = await createMoneyDonation(req.user!.userId, {
      ngoId, amount: Number(amount), message,
    });
    sendSuccess(res, donation, 201);
  } catch (err) { next(err); }
};

export const getMyMoneyDonationsHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const donations = await getMyMoneyDonations(req.user!.userId);
    sendSuccess(res, donations);
  } catch (err) { next(err); }
};

// ─── NGO Accounts ────────────────────────────────────────────────────────────

export const getNGOAccountHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const overview = await getNGOAccountOverview(req.user!.userId);
    sendSuccess(res, overview);
  } catch (err) { next(err); }
};

export const recordExpenseHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { amount, category, description } = req.body;
    const expense = await recordExpense(req.user!.userId, {
      amount: Number(amount), category, description,
    });
    sendSuccess(res, expense, 201);
  } catch (err) { next(err); }
};

export const getAccountHistoryHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const history = await getAccountHistory(req.user!.userId);
    sendSuccess(res, history);
  } catch (err) { next(err); }
};
