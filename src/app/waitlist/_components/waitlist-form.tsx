"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
    FormField,
    FormItem,
    FormMessage,
    FormControl,
    Form,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Icons } from "@/components/ui/icons";
import {createClient} from "@/utils/supabase/client";

const supabase = createClient();

const waitformSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
});

type WaitformSchemaType = z.infer<typeof waitformSchema>;

export function WaitlistForm() {
    const form = useForm<WaitformSchemaType>({
        resolver: zodResolver(waitformSchema),
        defaultValues: {
            name: "",
            email: "",
        },
    });

    const { mutate, isPending } = useMutation({
        mutationFn: async (data: WaitformSchemaType) => {
            const { error } = await supabase
                .from('waitlist_users')
                .insert([data]);

            if (error) throw error;
        },
        onSuccess: () => {
            toast("You have been added to waitlist", {
                description: "You will be notified when the waitlist opens",
            });
            form.reset();
        },
        onError: (error) => {
            console.error('Error adding to waitlist:', error);
            toast.error("Something went wrong", {
                description: "Please try again later",
            });
        },
    });

    const onSubmit = (data: WaitformSchemaType) => {
        mutate(data);
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid w-full max-w-md gap-4"
            >
                <div className="grid w-full grid-cols-2 gap-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        className="h-10 w-full bg-background"
                                        placeholder="Name"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        className="h-10 w-full bg-background"
                                        placeholder="Email"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button
                    disabled={isPending}
                    type="submit"
                    className="w-full gap-2"
                >
                    {isPending ? <Icons.loader className="h-4 w-4" /> : null}
                    <span>Join the waitlist</span>
                </Button>
            </form>
        </Form>
    );
}