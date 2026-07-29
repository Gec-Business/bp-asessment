import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getGlobalSettings = cache(async () => {
    return prisma.globalSettings.findFirst();
});
