import { Controller, Get, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiExcludeController } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';

@ApiExcludeController()
@Controller({ version: VERSION_NEUTRAL })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('terms-and-conditions')
  getTermsAndConditions(@Res() res: FastifyReply) {
    const html = this.appService.getTermsAndConditions('ar');
    res.type('text/html').send(html);
  }

  @Get('terms-and-conditions/en')
  getTermsAndConditionsEn(@Res() res: FastifyReply) {
    const html = this.appService.getTermsAndConditions('en');
    res.type('text/html').send(html);
  }

  @Get('terms-and-conditions/fr')
  getTermsAndConditionsFr(@Res() res: FastifyReply) {
    const html = this.appService.getTermsAndConditions('fr');
    res.type('text/html').send(html);
  }

  @Get('privacy-policy')
  getPrivacyPolicy(@Res() res: FastifyReply) {
    const html = this.appService.getPrivacyPolicy('ar');
    res.type('text/html').send(html);
  }

  @Get('privacy-policy/en')
  getPrivacyPolicyEn(@Res() res: FastifyReply) {
    const html = this.appService.getPrivacyPolicy('en');
    res.type('text/html').send(html);
  }

  @Get('privacy-policy/fr')
  getPrivacyPolicyFr(@Res() res: FastifyReply) {
    const html = this.appService.getPrivacyPolicy('fr');
    res.type('text/html').send(html);
  }
}
