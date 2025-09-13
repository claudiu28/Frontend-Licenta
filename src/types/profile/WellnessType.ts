export type GenderType = "MALE" | "FEMALE" | "OTHER";
export type ActivityLevelType = | "SEDENTARY" | "LIGHT" | "MODERATE" | "ACTIVE" | "VERY_ACTIVE";
export type GoalType = | "LOSE_FAT" | "GAIN_MUSCLE" | "MAINTAIN" | "PERFORMANCE";
export type EquipmentAccessType = "NONE" | "HOME_MINIMAL" | "HOME_FULL" | "GYM";

export interface WellnessDetails {
    gender?: GenderType;
    birthDate?: string;
    heightCm?: number | null;
    weightKg?: number | null;
    activityLevel?: ActivityLevelType;
    primaryGoal?: GoalType;
    equipmentAccess?: EquipmentAccessType;
    mealsPerDay?: number | null;
    dislikedFoods?: string;
    sleepTargetHours?: number | null;
    hydrationTargetMl?: number | null;
    stepsTarget?: number | null;
}
