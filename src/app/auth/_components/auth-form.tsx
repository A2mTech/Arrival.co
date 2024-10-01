"use client";
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useOnboardingStore } from '@/store/onboardingStore';

const personalSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
});

const educationSchema = z.object({
    fieldOfStudy: z.string().min(2, "Field of study must be at least 2 characters"),
    sector: z.string().min(2, "Sector must be at least 2 characters"),
});

const jobSearchSchema = z.object({
    cvPerDay: z.number().min(0, "Must be a positive number"),
    hasResponses: z.boolean(),
    responseCount: z.number().min(0, "Must be a positive number"),
});

const signupSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

type AuthFormProps = {
    type: "signup" | "login";
};

const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

export function AuthForm({ type }: AuthFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [direction, setDirection] = useState(0);
    const supabase = createClient();
    const {
        step, firstName, fieldOfStudy, sector, cvPerDay, hasResponses, responseCount,
        setStep, setFirstName, setFieldOfStudy, setSector, setCvPerDay, setHasResponses, setResponseCount
    } = useOnboardingStore();


    const personalForm = useForm({
        resolver: zodResolver(personalSchema),
        defaultValues: { firstName },
    });

    const educationForm = useForm({
        resolver: zodResolver(educationSchema),
        defaultValues: { fieldOfStudy, sector },
    });

    const jobSearchForm = useForm({
        resolver: zodResolver(jobSearchSchema),
        defaultValues: { cvPerDay, hasResponses, responseCount },
    });

    const signupForm = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: { email: "", password: "" },
    });

    const nextStep = () => {
        setDirection(1);
        if (step === 'personal') setStep('education');
        else if (step === 'education') setStep('jobSearch');
        else if (step === 'jobSearch') setStep('signup');
    };

    const previousStep = () => {
        setDirection(-1);
        if (step === 'education') setStep('personal');
        else if (step === 'jobSearch') setStep('education');
        else if (step === 'signup') setStep('jobSearch');
    };

    const onSubmitPersonal = (data: { firstName: string }) => {
        setFirstName(data.firstName);
        nextStep();
    };

    const onSubmitEducation = (data: { fieldOfStudy: string; sector: string }) => {
        setFieldOfStudy(data.fieldOfStudy);
        setSector(data.sector);
        nextStep();
    };

    const onSubmitJobSearch = (data: { cvPerDay: number; hasResponses: boolean; responseCount: number }) => {
        setCvPerDay(data.cvPerDay);
        setHasResponses(data.hasResponses);
        setResponseCount(data.responseCount);
        nextStep();
    };

    const onSubmitSignup = async (data: { email: string; password: string }) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        firstName,
                        fieldOfStudy,
                        sector,
                        cvPerDay,
                        hasResponses,
                        responseCount,
                    }
                }
            });

            if (error) {
                setIsLoading(false);
                console.log(error);
                toast.error("An error occurred. Please try again later. : " + error.message);
                return;
            }

            toast.success("Check your email to confirm your account", {
                description: "A confirmation link has been sent to your email address.",
            });
        } catch (error) {
            toast.error("An error occurred. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch(step) {
            case 'personal':
                return (
                    <Form {...personalForm}>
                        <form onSubmit={personalForm.handleSubmit(onSubmitPersonal)} className="space-y-6">
                            <FormField
                                control={personalForm.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit">Next</Button>
                        </form>
                    </Form>
                );
            case 'education':
                return (
                    <Form {...educationForm}>
                        <form onSubmit={educationForm.handleSubmit(onSubmitEducation)} className="space-y-6">
                            <FormField
                                control={educationForm.control}
                                name="fieldOfStudy"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Field of Study (BTS)</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={educationForm.control}
                                name="sector"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sector</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-between">
                                <Button type="button" onClick={previousStep}>Back</Button>
                                <Button type="submit">Next</Button>
                            </div>
                        </form>
                    </Form>
                );
            case 'jobSearch':
                // @ts-ignore
                return (
                    <Form {...jobSearchForm}>
                        <form onSubmit={jobSearchForm.handleSubmit(onSubmitJobSearch)} className="space-y-6">
                            <FormField
                                control={jobSearchForm.control}
                                name="cvPerDay"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>How many CVs do you send per day?</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={jobSearchForm.control}
                                name="hasResponses"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Have you received any responses?</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="checkbox"
                                                {...field}
                                                checked={field.value}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.checked)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {jobSearchForm.watch('hasResponses') && (
                                <FormField
                                    control={jobSearchForm.control}
                                    name="responseCount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>How many responses have you received?</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            <div className="flex justify-between">
                                <Button type="button" onClick={previousStep}>Back</Button>
                                <Button variant={"default"} type="submit">Next</Button>
                            </div>
                        </form>
                    </Form>
                );
            case 'signup':
                return (
                    <Form {...signupForm}>
                        <form onSubmit={signupForm.handleSubmit(onSubmitSignup)} className="space-y-6">
                            <FormField
                                control={signupForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={signupForm.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-between">
                                <Button type="button" onClick={previousStep}>Back</Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Loading...' : 'Sign Up'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                );
            default:
                return null;
        }
    };
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={fadeVariants}
                transition={{ duration: 0.3 }}
            >
                {renderStep()}
            </motion.div>
        </AnimatePresence>
    );
}