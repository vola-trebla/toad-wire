import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  transport: {
    targets: [
      ...(isDev
        ? [
            {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:standard' },
              level: 'debug',
            },
          ]
        : []),
      {
        target: '@axiomhq/pino',
        options: {
          dataset: process.env.AXIOM_DATASET,
          token: process.env.AXIOM_TOKEN,
        },
        level: 'info',
      },
    ],
  },
});
