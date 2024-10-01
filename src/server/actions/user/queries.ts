import "server-only";

import { createClient } from "@/utils/supabase/server";
import { z } from "zod";
import { eachMonthOfInterval, format, startOfMonth, subMonths } from "date-fns";
import {siteUrls} from "@/config/urls";
import {redirect} from "next/navigation";


/**
 * Get paginated users
 * @param page - page number
 * @param per_page - number of items per page
 * @param sort - sort by column
 * @param email - filter by email
 * @param role - filter by role
 * @param operator - filter by operator
 *
 * @returns Paginated users
 */

const panginatedUserPropsSchema = z.object({
    page: z.coerce.number().default(1),
    per_page: z.coerce.number().default(10),
    sort: z.string().optional(),
    email: z.string().optional(),
    role: z.string().optional(),
    operator: z.string().optional(),
});

type GetPaginatedUsersQueryProps = z.infer<typeof panginatedUserPropsSchema>;

export async function getPaginatedUsersQuery(
    input: GetPaginatedUsersQueryProps,
) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    // Check if user is admin
    const { data: userData } = await supabase
        .from('account')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!['Admin', 'Super Admin'].includes(userData?.role ?? '')) {
        throw new Error("Not authorized");
    }

    const offset = (input.page - 1) * input.per_page;

    let query = supabase
        .from('account')
        .select('*', { count: 'exact' });

    if (input.email) {
        query = query.ilike('email', `%${input.email}%`);
    }

    if (input.role) {
        const roles = input.role.split('.');
        query = query.in('role', roles);
    }

    if (input.sort) {
        const [column, order] = input.sort.split('.') as [string, string];
        if (column) {
            query = query.order(column, { ascending: order === 'asc' });
        }
    } else {
        query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query
        .range(offset, offset + input.per_page - 1);

    if (error) throw error;

    const total = count ?? 0;
    const pageCount = Math.ceil(total / input.per_page);

    return { data, pageCount, total };
}

export async function getUsersCount() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Not authenticated");
    }

    // Check if user is admin
    const { data: userData } = await supabase
        .from('account')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!['Admin', 'Super Admin'].includes(userData?.role ?? '')) {
        redirect(siteUrls.dashboard.home);
    }

    const dateBeforeMonths = subMonths(new Date(), 6);
    const startDateOfTheMonth = startOfMonth(dateBeforeMonths);

    const { data, error, count } = await supabase
        .from('account')
        .select('created_at', { count: 'exact' })
        .gte('created_at', startDateOfTheMonth.toISOString());

    if (error) throw error;

    const months = eachMonthOfInterval({
        start: startDateOfTheMonth,
        end: new Date(),
    });

    const usersCountByMonth = months.map((month) => {
        const monthStr = format(month, "MMM-yyy");
        const count = data?.filter(
            (user) => format(new Date(user?.created_at ?? ""), "MMM-yyy") === monthStr,
        ).length ?? 0;
        return { Date: monthStr, UsersCount: count };
    });

    return {
        usersCountByMonth,
        totalCount: count ?? 0,
    };
}