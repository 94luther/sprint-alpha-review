/**
 * The endpoints. Deliberately thin: every one of them names the module that owns
 * the rule, checks who may ask, and gets out of the way.
 *
 * Who may ask matters as much as the rule itself. A customer may price a parcel
 * and watch their own order. Only a rider's app empties an outbox or asks what to
 * do at a door. Only ops sees the board, and only ops moves money on a company's
 * account. That was decided here rather than left to whoever calls the module.
 */

import { Body, Controller, ForbiddenException, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { EngineService } from './engine.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

function roleOf(req: Request): string {
  return ((req as any).user as { role?: string })?.role ?? '';
}

function only(req: Request, roles: string[], what: string) {
  if (!roles.includes(roleOf(req))) {
    throw new ForbiddenException(`${what} is for ${roles.join(' or ')} only.`);
  }
}

@Controller('engine')
export class EngineController {
  constructor(private readonly engine: EngineService) {}

  /* ---------------------------------------------- anybody with an account */

  @Get('parcel/quote')
  @UseGuards(JwtAuthGuard)
  quoteParcel(@Query('kg') kg: string, @Query('zone') zone: string) {
    return this.engine.quoteParcel(Number(kg), zone);
  }

  @Get('parcel/ladder')
  @UseGuards(JwtAuthGuard)
  ladder(@Query('zone') zone: string, @Query('upToKg') upToKg?: string) {
    return this.engine.parcelLadder(zone, upToKg ? Number(upToKg) : 5);
  }

  /** Where Sprint actually reaches. No token needed: it is a public claim. */
  @Get('coverage')
  coverage() {
    return this.engine.coverage();
  }

  @Post('tracking/panels')
  @UseGuards(JwtAuthGuard)
  tracking(@Body() body: { state: string; since: string; passport?: any; already_asked?: boolean }) {
    return this.engine.trackingPanels(body?.state, body?.since, body?.passport ?? null, body?.already_asked === true);
  }

  /* ------------------------------------------------------ the rider's app */

  @Post('handover/requirement')
  @UseGuards(JwtAuthGuard)
  requirement(@Req() req: Request, @Body() body: { sensitivity: string }) {
    only(req, ['courier', 'ops'], 'What to do at a door');
    return this.engine.handoverRequirement(body?.sensitivity);
  }

  @Post('handover/code')
  @UseGuards(JwtAuthGuard)
  code(@Req() req: Request) {
    only(req, ['courier', 'ops'], 'A handover code');
    return this.engine.handoverCode();
  }

  @Post('liquor/handover')
  @UseGuards(JwtAuthGuard)
  liquor(@Req() req: Request, @Body() body: { licence: any; arrives_at: string }) {
    only(req, ['courier', 'ops'], 'A liquor handover check');
    return this.engine.liquorHandover(body?.licence ?? null, body?.arrives_at);
  }

  @Post('outbox/sync')
  @UseGuards(JwtAuthGuard)
  sync(@Req() req: Request, @Body() body: { outbox: unknown; online?: boolean }) {
    only(req, ['courier', 'ops'], 'Emptying an outbox');
    return this.engine.syncOutbox(body?.outbox, body?.online !== false);
  }

  /* ----------------------------------------------------------------- ops */

  @Post('till/state')
  @UseGuards(JwtAuthGuard)
  till(@Req() req: Request, @Body() body: { offer: unknown; till: unknown }) {
    only(req, ['ops', 'merchant'], 'The till view');
    return this.engine.tillState(body?.offer, body?.till);
  }

  @Post('board')
  @UseGuards(JwtAuthGuard)
  board(@Req() req: Request, @Body() body: { live?: unknown; done?: unknown; riders?: any[] }) {
    only(req, ['ops'], 'The ops board');
    return this.engine.board(body?.live, body?.done, body?.riders ?? []);
  }

  /* ------------------------------------------------------ on account */

  @Post('account/order')
  @UseGuards(JwtAuthGuard)
  onAccount(
    @Req() req: Request,
    @Body() body: { book: any[]; account: any; account_id: string; amount_thebe: number; cost_centre: string; order_id: string; description?: string },
  ) {
    only(req, ['ops'], 'Placing an order on a company account');
    return this.engine.orderOnAccount(
      body?.book ?? [], body?.account, body?.account_id,
      body?.amount_thebe, body?.cost_centre, body?.order_id,
      body?.description ?? 'goods',
    );
  }

  @Post('account/cancel')
  @UseGuards(JwtAuthGuard)
  cancelAccount(@Req() req: Request, @Body() body: { book: any[]; order_id: string }) {
    only(req, ['ops'], 'Cancelling an order on account');
    return this.engine.cancelAccountOrder(body?.book ?? [], body?.order_id);
  }

  @Post('account/statement')
  @UseGuards(JwtAuthGuard)
  statement(
    @Req() req: Request,
    @Body() body: { account: any; book: any[]; account_id: string; from: string; to: string },
  ) {
    only(req, ['ops'], 'A company statement');
    return this.engine.accountStatement(body?.account, body?.book ?? [], body?.account_id, body?.from, body?.to);
  }
}
