import {z} from 'zod';
import {extendZodWithOpenApi} from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

const recordId = z.coerce.number({
  required_error: 'Record ID is required',
  invalid_type_error: 'Record ID must be a number',
});

const Comment = z.coerce
  .string({
    required_error: 'Comment is required',
    invalid_type_error: 'Comment must be a string',
  })
  .min(1, 'Comment cannot be empty');

const Minutes = z.coerce
  .number({
    invalid_type_error: 'Minutes must be a number',
  })
  .optional();

////////////////////////

const CommentAndMinutes = z
  .object({
    recordId,
    Comment,
    Minutes,
  })
  .openapi('CommentAndMinutes');

const OnlyRecordId = z
  .object({
    recordId,
  })
  .openapi('OnlyRecordId');

const OnlyComment = z
  .object({
    recordId,
    Comment,
  })
  .openapi('OnlyComment');

const OnlyMinutes = z
  .object({
    recordId,
    Minutes,
  })
  .openapi('OnlyMinutes');

export {
  CommentAndMinutes as publicUpdate,
  CommentAndMinutes as privateUpdate,
  CommentAndMinutes as requestFeedback,
  CommentAndMinutes as closeTicket,
  CommentAndMinutes as openTicket,
  OnlyRecordId as assignToMe,
  OnlyComment as requesterComment,
  OnlyMinutes as timeEntry,
};
