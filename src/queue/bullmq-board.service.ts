import { Injectable, OnModuleInit } from '@nestjs/common';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';

@Injectable()
export class BullMQBoardService implements OnModuleInit {
  private serverAdapter = new ExpressAdapter();
  private board = createBullBoard({
    queues: [],
    serverAdapter: this.serverAdapter,
  });

  onModuleInit() {
    this.serverAdapter.setBasePath('/admin/queues');
    
    this.serverAdapter.setUIConfig({
      boardTitle: 'Goouty Queue',
      miscLinks: [
        {
          text: 'Back to API',
          url: '/api',
        },
      ],
    });
  }

  addQueue(queue: Queue) {
    this.board.addQueue(new BullMQAdapter(queue));
  }

  getServerAdapter() {
    return this.serverAdapter;
  }
}
