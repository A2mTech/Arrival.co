"use server";

import { z } from "zod";
import {createClient} from "@/utils/supabase/server";

// Initialize Supabase client

// Schemas
const feedbackInsertSchema = z.object({
    title: z.string().min(3, "Title is too short").max(255, "Title is too long"),
    message: z.string().min(10, "Message is too short").max(1000, "Message is too long"),
    label: z.enum(["Issue", "Idea", "Question", "Complaint", "Feature Request", "Other"]),
});

const feedbackUpdateSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(["Open", "In Progress", "Closed"]),
    label: z.enum(["Issue", "Idea", "Question", "Complaint", "Feature Request", "Other"]),
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

export async function createFeedbackMutation(props: z.infer<typeof feedbackInsertSchema>) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const feedbackParse = feedbackInsertSchema.safeParse(props);
    if (!feedbackParse.success) {
        throw new Error("Invalid feedback", { cause: feedbackParse.error.errors });
    }

    const { data, error } = await supabase
        .from('feedback')
        .upsert({ user_id: user.id, ...feedbackParse.data })
        .select()
        .single();

    if (error) throw new Error("Error creating feedback");
    return data;
}

export async function removeUserFeedbackMutation({ id }: { id: string }) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from('feedback')
        .delete()
        .match({ id, user_id: user.id });

    if (error) throw new Error("Error removing feedback");
    return data;
}

export async function updateFeedbackMutation(props: z.infer<typeof feedbackUpdateSchema>) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !(await isAdmin(user.id))) throw new Error("Not authorized");

    const feedbackParse = feedbackUpdateSchema.safeParse(props);
    if (!feedbackParse.success) {
        throw new Error("Invalid feedback", { cause: feedbackParse.error.errors });
    }

    const { data, error } = await supabase
        .from('feedback')
        .update(feedbackParse.data)
        .match({ id: feedbackParse.data.id })
        .select();

    if (error) throw new Error("Error updating feedback");
    return data;
}

export async function deleteFeedbackMutation({ id }: { id: string }) {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !(await isAdmin(user.id))) throw new Error("Not authorized");

    const { data, error } = await supabase
        .from('feedback')
        .delete()
        .match({ id });

    if (error) throw new Error("Error deleting feedback");
    return data;
}