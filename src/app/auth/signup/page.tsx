"use client";
import React from 'react';
import { AuthForm } from "@/app/auth/_components/auth-form";
import { signupPageConfig } from "@/app/auth/signup/_constants/page-config";
import { useOnboardingStore } from '@/store/onboardingStore';
import { motion } from "framer-motion";

export default function Signup() {
    const { step } = useOnboardingStore();

    const getStepTitle = () => {
        switch(step) {
            case 'personal':
                return 'Tell us about yourself';
            case 'education':
                return 'Your education';
            case 'jobSearch':
                return 'Your job search';
            case 'signup':
                return 'Create your account';
            default:
                return signupPageConfig.title;
        }
    };

    const getStepDescription = () => {
        switch(step) {
            case 'personal':
                return "Let's start with your name";
            case 'education':
                return "Tell us about your studies";
            case 'jobSearch':
                return "Share your job search experience";
            case 'signup':
                return "Final step to join our community";
            default:
                return signupPageConfig.description;
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-3xl font-bold mb-2">{getStepTitle()}</h1>
                    <p className="text-muted-foreground">{getStepDescription()}</p>
                </motion.div>

                <AuthForm type="signup" />

                {step === 'signup' && (
                    <motion.div
                        className="mt-8 text-center text-sm text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <p>
                            Already have an account?{" "}
                            <a href="/login" className="text-primary hover:underline">
                                Log in
                            </a>
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}