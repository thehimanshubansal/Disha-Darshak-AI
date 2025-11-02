'use client';
import CareerCompassLayout from "@/components/career-compass/career-compass-layout";
import PageLoader from "@/components/career-compass/page-loader";
import ProfileCompletionDialog from "@/components/career-compass/ProfileCompletionDialog";
import TwinklingStars from "@/components/career-compass/twinkling-stars";
import { useAppContext } from "@/contexts/app-context";

export default function Home() {
  // We no longer need the initialLoading state here
  const { isLoadingAuth, isProfileChecked, showProfileCompletion } = useAppContext();

  // Keep showing the loader while Firebase auth is initializing OR
  // while we are still waiting for the initial database profile check to complete.
  if (isLoadingAuth || !isProfileChecked) {
    return <PageLoader />;
  }

  // If the profile check is done AND it determined the user needs to complete their profile,
  // show ONLY the completion dialog with the standard background.
  if (showProfileCompletion) {
    return (
      <>
        <TwinklingStars />
        <ProfileCompletionDialog />
      </>
    );
  }

  // Once authentication is resolved and the profile is checked and found to be complete, show the full app.
  return (
    <CareerCompassLayout />
  );
}