// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { LLMRequest, LLMResponse } from '../../models';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://oai.hconeai.com/v1',
  defaultHeaders: {
    'Helicone-Cache-Enabled': 'true',
    'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LLMResponse | { error: string }>
) {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.NEXT_PUBLIC_LLM_API_KEY}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const llmRequest: LLMRequest = req.body;
  console.log(`LLM middleware: got request: ${JSON.stringify(llmRequest)}`);
  const completion = await openai.chat.completions.create(
    llmRequest.completion_create
  );
  console.log(`LLM middleware: got completion: ${JSON.stringify(completion)}`);
  const response: LLMResponse = { completion };
  res.status(200).json(response);
}
