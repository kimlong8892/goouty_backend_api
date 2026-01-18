import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { formatInTimeZone } from 'date-fns-tz';

@Injectable()
export class TimezoneInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(map((data) => this.transformData(data)));
    }

    private transformData(data: any): any {
        if (data instanceof Date) {
            return formatInTimeZone(data, 'Asia/Ho_Chi_Minh', "yyyy-MM-dd'T'HH:mm:ss.SSS");
        }

        return data;
    }
}
