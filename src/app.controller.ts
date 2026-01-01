import { Controller, Get, Redirect } from '@nestjs/common';
import {ApiExcludeController} from "@nestjs/swagger";

@ApiExcludeController()
@Controller()
export class AppController {
    @Get()
    @Redirect('/docs', 302) // redirect sang Swagger UI
    redirectToDocs() {}
}
