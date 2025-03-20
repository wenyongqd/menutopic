"use client";

import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export function HelpButton() {
  const handleEmailClick = () => {
    // Configure email parameters
    const emailConfig = {
      to: "support@chatopsis.com",
      subject: "MenuToPic Support Request",
      body: "Please describe your issue:\n\n" +
            "---------------------\n" +
            "• What problem are you experiencing?\n" +
            "• What were you trying to do?\n" +
            "• Any error messages you saw?\n\n" +
            "We'll get back to you within 24 hours.",
    };

    // Build mailto link
    const mailtoLink = `mailto:${emailConfig.to}?subject=${encodeURIComponent(
      emailConfig.subject
    )}&body=${encodeURIComponent(emailConfig.body)}`;

    // Open system default email client
    window.location.href = mailtoLink;
  };

  return (
    <Button
      onClick={handleEmailClick}
      variant="ghost"
      size="sm"
      className="fixed bottom-6 right-6 rounded-full bg-primary-100 text-white hover:bg-primary-200 shadow-lg z-40 transition-transform hover:scale-105"
    >
      <HelpCircle className="h-5 w-5" />
      <span className="ml-2">Need Help?</span>
    </Button>
  );
} 