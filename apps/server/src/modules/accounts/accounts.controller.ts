import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { IsString } from 'class-validator';
import { AccountsService } from './accounts.service';

class UpdateCredentialDto {
  @IsString()
  credentialBlob!: string;
}

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async findAll() {
    return this.accountsService.findAll();
  }

  @Post(':id/validate')
  async validate(@Param('id') id: string) {
    return this.accountsService.validateAccount(id);
  }

  @Post(':id/default')
  async setDefault(@Param('id') id: string) {
    return this.accountsService.setDefaultAccount(id);
  }

  @Post('validate-all')
  async validateAll() {
    return this.accountsService.validateAllAccounts();
  }

  @Put(':id/credential')
  async updateCredential(@Param('id') id: string, @Body() body: UpdateCredentialDto) {
    return this.accountsService.updateCredential(id, body);
  }
}
