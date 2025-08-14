import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CartsClient from '@/app/carts/CartsClient';

export default async function CartsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/carts');
  }

  const cc = await clerkClient();
  const user = await cc.users.getUser(userId);
  const planRaw = (user.privateMetadata?.plan as unknown) ?? 0;
  const plan = typeof planRaw === 'number' ? planRaw : 0;

  if (plan <= 0) {
    redirect('/');
  }

  return <CartsClient initialPlan={plan} />;
}


