"use server";
/**
 * @purpose This file contains all the server procedures
 */

import { createClient } from "@/utils/supabase/server";
import { z } from "zod";


const userRoles = z.enum(["User", "Admin", "Super Admin"]);

type User = {
    id: string;
    email: string;
    role: z.infer<typeof userRoles>;
};

/**
 * @purpose Get the current user
 * @description This function retrieves the current authenticated user
 */
async function getUser(): Promise<User | null> {
    const supabase = createClient();

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data: userData, error: userError } = await supabase
        .from('account')
        .select('role')
        .eq('id', user.id)
        .single();

    if (userError || !userData) return null;

    return {
        id: user.id,
        email: user.email!,
        role: userData.role as z.infer<typeof userRoles>
    };
}

/**
 * @purpose This is a protected procedure
 * @description This procedure is protected and can only be accessed by authenticated users
 */
export const protectedProcedure = async () => {
    const user = await getUser();

    if (!user) {
        throw new Error("You are not authenticated");
    }

    return { user };
};

/**
 * @purpose This is an admin procedure
 * @description This procedure is protected and can only be accessed by admins
 */
export const adminProcedure = async () => {
    const user = await getUser();

    if (!user || (user.role !== "Admin" && user.role !== "Super Admin")) {
        throw new Error("You are not authorized to perform this action");
    }

    return { user };
};

/**
 * @purpose This is a super admin procedure
 * @description This procedure is protected and can only be accessed by super admins
 */
export const superAdminProcedure = async () => {
    const user = await getUser();

    if (!user || user.role !== "Super Admin") {
        throw new Error("You are not authorized to perform this action");
    }

    return { user };
};