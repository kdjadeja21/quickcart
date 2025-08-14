import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const cc = await clerkClient();
    const user = await cc.users.getUser(userId);
    const privateMetadata = (user.privateMetadata || {}) as Record<string, unknown>;
    
    // Check if plan exists in privateMetadata
    if (privateMetadata.plan !== undefined && privateMetadata.plan !== null) {
      const currentPlan = typeof privateMetadata.plan === 'number' ? privateMetadata.plan : 0;
      return NextResponse.json({ plan: currentPlan }, { status: 200 });
    }

    // Only set plan: 0 if there's no value in privateMetadata
    const defaultPlan = 0;
    const updated = await cc.users.updateUser(userId, {
      privateMetadata: { ...privateMetadata, plan: defaultPlan },
    });

    const plan = (updated.privateMetadata?.plan as number) ?? defaultPlan;
    return NextResponse.json({ plan }, { status: 200 });
  } catch (error) {
    console.error('Failed to get/set privateMetadata.plan', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const desiredPlanRaw = (body as Record<string, unknown>)?.plan;
    const desiredPlan = Number.isFinite(desiredPlanRaw as number)
      ? (desiredPlanRaw as number)
      : 0;

    const cc = await clerkClient();
    const user = await cc.users.getUser(userId);
    const privateMetadata = (user.privateMetadata || {}) as Record<string, unknown>;

    const updated = await cc.users.updateUser(userId, {
      privateMetadata: { ...privateMetadata, plan: desiredPlan },
    });

    const plan = (updated.privateMetadata?.plan as number) ?? desiredPlan;
    return NextResponse.json({ plan }, { status: 200 });
  } catch (error) {
    console.error('Failed to update privateMetadata.plan', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


