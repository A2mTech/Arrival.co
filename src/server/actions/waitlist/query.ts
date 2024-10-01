import { createClient } from "@/utils/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { z } from "zod";


const panginatedWaitlistPropsSchema = z.object({
    page: z.coerce.number().default(1),
    per_page: z.coerce.number().default(10),
    sort: z.string().optional(),
    email: z.string().optional(),
    operator: z.string().optional(),
});

type GetPaginatedWaitlistQueryProps = z.infer<
    typeof panginatedWaitlistPropsSchema
>;

export async function getPaginatedWaitlistQuery(
    input: GetPaginatedWaitlistQueryProps,
) {

    const supabase = createClient();

    noStore();

    // Check if user is admin (replace with your actual admin check)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Not authenticated");
    }

    const { data: userData } = await supabase
        .from('account')
        .select('role')
        .eq('id', user.id)
        .single();

    if (userData?.role !== 'Admin' && userData?.role !== 'Super Admin') {
        throw new Error("Not authorized");
    }

    const offset = (input.page - 1) * input.per_page;

    let query = supabase
        .from('waitlist_users')
        .select('*', { count: 'exact' });

    if (input.email) {
        query = query.ilike('email', `%${input.email}%`);
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

export async function getAllWaitlistUsersQuery() {
    const supabase = createClient();

    noStore();

    // Check if user is admin (replace with your actual admin check)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Not authenticated");
    }

    const { data: userData } = await supabase
        .from('account')
        .select('role')
        .eq('id', user.id)
        .single();

    if (userData?.role !== 'Admin' && userData?.role !== 'Super Admin') {
        throw new Error("Not authorized");
    }

    const { data, error } = await supabase
        .from('waitlist_users')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data;
}