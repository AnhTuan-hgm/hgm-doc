import { useNavigate } from "react-router";
import { Avatar } from "@/components/base/avatar/avatar";
import { useAuthUser } from "@/hooks/use-auth-user";

/**
 * Floating user avatar shown beneath the theme toggle. Pulls the photo from the
 * signed-in Google account and opens the settings page on click. Renders nothing
 * when signed out.
 */
export const UserAvatarButton = () => {
    const navigate = useNavigate();
    const { user } = useAuthUser();

    if (!user) return null;

    const initials = user.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <button
            type="button"
            onClick={() => navigate("/settings")}
            title="Settings"
            aria-label="Open settings"
            className="fixed right-4 top-16 z-50 rounded-full shadow-sm outline-focus-ring transition duration-100 ease-linear hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
            <Avatar size="md" src={user.avatarUrl} alt={user.name} initials={initials} border />
        </button>
    );
};
