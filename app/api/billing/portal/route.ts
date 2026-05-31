import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getPaddleClient } from "@/lib/billing/paddle";
import { getUserSubscription } from "@/lib/billing/subscription";
import { getErrorMessage } from "@/lib/errors";

type PortalSession = {
  urls?: { general?: { overview?: string } };
  url?: string;
};

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getUserSubscription(user.id);
  if (!sub.paddle_customer_id) {
    return NextResponse.json({ error: "No billing account found" }, { status: 404 });
  }

  try {
    const paddle = getPaddleClient();
    const session = await paddle.customerPortalSessions.create(
      sub.paddle_customer_id,
      sub.paddle_subscription_id ? [sub.paddle_subscription_id] : []
    ) as PortalSession;
    return NextResponse.json({ url: session.urls?.general?.overview ?? session.url });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err, "Failed to create portal session") }, { status: 500 });
  }
}
