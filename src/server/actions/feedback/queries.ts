"use server";

import { z } from "zod";
import { unstable_noStore as noStore } from "next/cache";
import {createClient} from "@/utils/supabase/server";

// Initialize Supabase client

// Schema for paginated feedback props
const panginatedFeedbackPropsSchema = z.object({
    page: z.coerce.number().default(1),
    per_page: z.coerce.number().default(10),
    sort: z.string().optional(),
    title: z.string().optional(),
    label: z.string().optional(),
    status: z.string().optional(),
    operator: z.string().optional(),
});

// Helper function to check if user is admin
async function isAdmin(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('account')
        .select('role')
        .eq('id', userId)
        .single();

    if (error) throw new Error("Error checking user role");
    return data.role === 'Admin' || data.role === 'Super Admin';
}

export async function getUserFeedbacksQuery() {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw new Error("Error fetching user feedback");
    return data;
}

export async function getAllPaginatedFeedbacksQuery(input: z.infer<typeof panginatedFeedbackPropsSchema>) {
    const supabase = createClient();

    noStore();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !(await isAdmin(user.id))) throw new Error("Not authorized");

    const { page, per_page, sort, title, label, status } = panginatedFeedbackPropsSchema.parse(input);

    let query = supabase
        .from('feedback')
        .select('*, users_pkey:account(id, name, email, image)', { count: 'exact' });

    if (title) query = query.ilike('title', `%${title}%`);
    if (label) query = query.in('label', label.split('.'));
    if (status) query = query.in('status', status.split('.'));

    if (sort) {
        const [column, order] = sort.split('.') as [string | undefined, 'asc' | 'desc' | undefined];
        if (column) {
            query = query.order(column, { ascending: order === 'asc' });
        }
    } else {
        query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query
        .range((page - 1) * per_page, page * per_page - 1);

    if (error) throw new Error("Error fetching paginated feedback");

    const pageCount = Math.ceil((count ?? 0) / per_page);

    return { data, pageCount, total: count };
}