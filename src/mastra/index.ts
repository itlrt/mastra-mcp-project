
import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { weatherWorkflow } from './workflows';
import { multiAgent } from './agents';
import { mcpAgent } from './agents/mcpAgent';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { multiAgent, mcpAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
