// src/store/onboardingStore.ts
import { create } from 'zustand';

type OnboardingStep = 'personal' | 'education' | 'jobSearch' | 'signup';

type OnboardingState = {
    step: OnboardingStep;
    firstName: string;
    fieldOfStudy: string;
    sector: string;
    cvPerDay: number;
    hasResponses: boolean;
    responseCount: number;
    setStep: (step: OnboardingStep) => void;
    setFirstName: (firstName: string) => void;
    setFieldOfStudy: (fieldOfStudy: string) => void;
    setSector: (sector: string) => void;
    setCvPerDay: (cvPerDay: number) => void;
    setHasResponses: (hasResponses: boolean) => void;
    setResponseCount: (responseCount: number) => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
    step: 'personal',
    firstName: '',
    fieldOfStudy: '',
    sector: '',
    cvPerDay: 0,
    hasResponses: false,
    responseCount: 0,
    setStep: (step) => set({ step }),
    setFirstName: (firstName) => set({ firstName }),
    setFieldOfStudy: (fieldOfStudy) => set({ fieldOfStudy }),
    setSector: (sector) => set({ sector }),
    setCvPerDay: (cvPerDay) => set({ cvPerDay }),
    setHasResponses: (hasResponses) => set({ hasResponses }),
    setResponseCount: (responseCount) => set({ responseCount }),
}));