"use client";

import { useState } from "react";
import GuideOverlay from "@/components/GuideOverlay";
import LearnSession from "@/components/LearnSession";

export default function LearnPage() {
    const [showGuide, setShowGuide] = useState<boolean>(true);
    const [participantId, setParticipantId] = useState<string>("");

    if (showGuide) {
        return <GuideOverlay onComplete={(id: string) => {
            setParticipantId(id);
            setShowGuide(false);
        }} />;
    }

    // Defaulting to Mode 'B' (Experimental/Chatbot) for the main /learn route
    return <LearnSession participantId={participantId} mode="B" />;
}
