"use client";
// The user designated /admin/system-texts for "Global Settings". 
// Checking the previous file, app/admin/settings/page.tsx had a "GeneralSettings" component that edited system texts.
// However, the CMS used "GlobalSettingsManager".
// I will render both here for now or just GlobalSettingsManager if it covers everything.
// But wait, the user specifically asked for "Global Settings -> Route: /admin/system-texts".
// And earlier app/admin/settings/page.tsx was editing "system-texts".
// I will use GlobalSettingsManager as it seems to be the main "Settings" of the CMS.
// I will ALSO create a separate /admin/settings page if needed, but the user asked to route "Global Settings" to System Texts.
// Let's assume they want the GlobalSettingsManager at /admin/global-settings and maybe the Text editor at /admin/system-texts?
// The user said: "Global Settings -> Route: /admin/system-texts (or /admin/global-settings)"
// I will put GlobalSettingsManager at /admin/global-settings and the Text Editor at /admin/system-texts.
// But wait, I need to match the Sidebar links.
// I'll create /admin/system-texts to use the text editor (from the old app/admin/settings/page.tsx code)
// AND /admin/global-settings for the GlobalSettingsManager.

import GlobalSettingsManager from "@/components/admin/GlobalSettingsManager";

export default function GlobalSettingsPage() {
    return <GlobalSettingsManager />;
}
