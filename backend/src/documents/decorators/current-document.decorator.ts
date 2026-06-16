import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { DocumentContext } from '../guards/document-access.guard';

/** Injects the document resolved by DocumentAccessGuard. */
export const CurrentDocument = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DocumentContext => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { document: DocumentContext }>();
    return req.document;
  },
);
