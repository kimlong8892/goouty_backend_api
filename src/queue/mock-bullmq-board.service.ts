
import { Injectable } from '@nestjs/common';
import { Express } from 'express';

@Injectable()
export class BullMQBoardService {
    private mockAdapter = {
        setBasePath: () => { },
        setUIConfig: () => { },
        getRouter: () => {
            // Return dummy router or middleware
            return (req, res, next) => {
                res.status(503).send('Queue Board Disabled');
            };
        },
    };

    addQueue(queue: any) { }

    getServerAdapter() {
        return this.mockAdapter;
    }
}
