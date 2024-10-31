import prisma from '@/config/db';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { name, email, phone, metaData } = req.body;

  //only accept post requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const emailExists = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (emailExists) {
      return res
        .status(200)
        .json({ message: 'Email already exists', user: emailExists });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        metaData,
      },
    });

    res.status(200).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
}
