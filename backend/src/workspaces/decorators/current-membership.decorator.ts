import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { MembershipContext } from '../guards/workspace-access.guard';

/** Injects the membership resolved by WorkspaceAccessGuard. */
export const CurrentMembership = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): MembershipContext => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { membership: MembershipContext }>();
    return req.membership;
  },
);
