import prisma from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';

export const addComment = async (
  requestId: string,
  authorId: string,
  role: string,
  body: string
) => {
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request) throw new AppError('Request not found', 404);

  if (role === 'CITIZEN' && request.citizenId !== authorId) {
    throw new AppError('You can only comment on your own requests', 403);
  }

  if (!body.trim()) throw new AppError('Comment cannot be empty', 400);

  return prisma.comment.create({
    data: { requestId, authorId, body: body.trim() },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
    },
  });
};

export const deleteComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new AppError('Comment not found', 404);
  if (comment.authorId !== userId) throw new AppError('You can only delete your own comments', 403);
  await prisma.comment.delete({ where: { id: commentId } });
  return { message: 'Comment deleted' };
};
