import { Browser, CodeBrowser, Code02, Globe01, LayoutAlt01 } from "@untitledui/icons";
import type { FC } from "react";

export interface Platform {
    id: string;
    name: string;
    icon: FC<{ className?: string }>;
    steps: string[];
    image?: string;
}

/**
 * Per-platform instructions for adding the Meta Pixel snippet.
 * Selecting a platform in Step 1 swaps the Step 2 instructions to the matching entry.
 */
export const platforms: Platform[] = [
    {
        id: "wix",
        name: "Wix",
        icon: Globe01,
        image: "/Section 3 Images/WIXZ.webp",
        steps: [
            "Log in to your Wix dashboard",
            "Go to Settings > Custom Code in your site's dashboard",
            "Click + Add Custom Code at the top right",
            "Paste the Meta Pixel code in the text box",
            "Set the placement to 'Head'",
            "Select 'All Pages' and click 'Apply'",
            "Save and Publish your changes",
        ],
    },
    {
        id: "squarespace",
        name: "Squarespace",
        icon: LayoutAlt01,
        image: "/Section 3 Images/SquareSpace.webp",
        steps: [
            "Log in to your Squarespace account",
            "Click on Go to website",
            "Click Pages",
            "Click Custom Code / Code Injection",
            "Paste the Meta Pixel code then Save",
        ],
    },
    {
        id: "wordpress",
        name: "WordPress",
        icon: Code02,
        image: "/Section 3 Images/WordPress.webp",
        steps: [
            "Log in to your WordPress account by going to yourdomain.com/admin",
            "Click Code Snippets on the side menu, or navigate to Header & Footer",
            "Paste the code into the Header section",
            "Click Save Changes",
        ],
    },
    {
        id: "framer",
        name: "Framer",
        icon: CodeBrowser,
        image: "/Section 3 Images/Framer.webp",
        steps: [
            "Open your project in the Framer editor",
            "Go to Site Settings > General > Custom Code",
            "Paste the pixel code into the 'Start of <head> tag' field",
            "Click Save to store the snippet",
            "Publish your site to apply the changes",
        ],
    },
    {
        id: "webflow",
        name: "Webflow",
        icon: Browser,
        image: "/Section 3 Images/Webflow.webp",
        steps: [
            "Open your project in the Webflow Designer",
            "Go to Project Settings > Custom Code",
            "Paste the code into the 'Head Code' field",
            "Click 'Save Changes' and then 'Publish' to make it live",
        ],
    },
];

/** The Meta Pixel base code snippet (Pixel ID is injected by the HiddenGem team). */
export const PIXEL_CODE = `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`;
