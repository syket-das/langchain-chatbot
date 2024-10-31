import prisma from '@/config/db';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { email, metaData } = req.body;

  //only accept post requests
  if (req.method !== 'PUT') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const emailExists = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (!emailExists) {
      return res.status(400).json({ message: 'Email does not exist' });
    }

    const user = await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        metaData,
      },
    });

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}
