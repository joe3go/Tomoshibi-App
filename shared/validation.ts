export function isValidUUID(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validateTutorId(tutorId: string | undefined): string {
  if (!tutorId) {
    throw new Error("Tutor ID is required");
  }

  if (!isValidUUID(tutorId)) {
    console.error("❌ Invalid tutorId format:", tutorId);
    throw new Error("Invalid tutor ID format. Please select a valid tutor.");
  }

  return tutorId;
}

// Default tutor UUIDs from the Supabase personas table
export const DEFAULT_TUTORS = {
  AOI: "9612651e-d1df-428f-865c-2a1c005952ef", // Aoi - formal tutor
  KEIKO: "8b0f056c-41fb-4c47-baac-6029c64e026a", // Keiko - peer
  REN: "3d01fccc-4092-4f8c-90ae-3a53780f1f59", // Ren - energetic tutor
  YUKI: "f9283245-d0de-4638-9af8-e52abcc99f55" // Yuki - reserved tutor
} as const;

export function getDefaultTutorId(): string {
  return DEFAULT_TUTORS.AOI; // Use Aoi as default formal tutor
}