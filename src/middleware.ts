import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { protectedRoutes, siteUrls } from "@/config/urls";
import { getAbsoluteUrl } from "@/lib/utils";
import { env } from "@/env";
import {createClient} from "@/utils/supabase/server";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isAdminPath = pathname.startsWith("/admin");

    /** check if application setting is on or off */
    const maintenanceMode = env.NEXT_PUBLIC_MAINTENANCE_MODE === "on";
    const waitlistMode = env.NEXT_PUBLIC_WAITLIST_MODE === "on";

    if (
        maintenanceMode &&
        !pathname.startsWith("/maintenance") &&
        !isAdminPath &&
        !pathname.startsWith("/auth")
    ) {
        return NextResponse.redirect(getAbsoluteUrl(siteUrls.maintenance));
    }

    if (
        waitlistMode &&
        !pathname.startsWith("/waitlist") &&
        !isAdminPath &&
        !pathname.startsWith("/auth")
    ) {
        return NextResponse.redirect(getAbsoluteUrl(siteUrls.waitlist));
    }

    // Update the session
    const response = await updateSession(request);

    // Get the user from the updated session
    const supabase = createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    /** if path is protected route */
    if (protectedRoutes.includes(pathname)) {
        /** if path name starts from /auth, and user is there redirect to dashboard */

        /** if path name does not start from /auth, and user is not there redirect to login */
        if (!user && !pathname.startsWith("/auth")) {
            console.log('user is not there')
            return NextResponse.redirect(getAbsoluteUrl(siteUrls.auth.login));
        }

        const isAdmin = supabase
            .from("account")
            .select("role")
            .eq("id", user?.id as string)
            .single()
            .then(({data}) => data?.role === "Admin" || data?.role === "Super Admin");

        /** if path name start from admin, and user role is not admin or super admin redirect to dashboard */
        if (
            user &&
            pathname.startsWith("/admin") &&
            !isAdmin
        ) {
            return NextResponse.redirect(
                getAbsoluteUrl(siteUrls.dashboard.home),
            );
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};