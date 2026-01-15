
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
        if (data === null || data === undefined) {
            return data;
        }

        if (data instanceof Date) {
            // Format to ISO with +07:00 (Asia/Ho_Chi_Minh)
            // Standard ISO format: yyyy-MM-dd'T'HH:mm:ss.SSSXXX
            // We keep milliseconds to be precise, or remove them if preferred.
            // Usually matching default JS toISOString (which has ms) is safe.
            return formatInTimeZone(data, 'Asia/Ho_Chi_Minh', "yyyy-MM-dd'T'HH:mm:ss.SSS");
        }

        if (Array.isArray(data)) {
            return data.map((item) => this.transformData(item));
        }

        if (typeof data === 'object') {
            const newData = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    newData[key] = this.transformData(data[key]);
                }
            }
            return newData;
        }

        return data;
    }
}
