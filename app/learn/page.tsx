"use client";

import { useState } from "react";
import GuideOverlay from "@/components/GuideOverlay";
import LearnSession from "@/components/LearnSession";

export default function LearnPage() {
    const [showGuide, setShowGuide] = useState<boolean>(true);
    const [participantId, setParticipantId] = useState<string>("");

    if (showGuide) {
        return <GuideOverlay onComplete={(id) => {
            setParticipantId(id);
            setShowGuide(false);
        }} />;
    }

    return <LearnSession participantId={participantId} />;
}
