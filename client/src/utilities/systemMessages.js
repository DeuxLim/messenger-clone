const REMOVED_NICKNAME_TEXT = "(removed the nickname)";
const REMOVED_CHAT_NAME_TEXT = "(removed the chat name)";

const toCleanString = (value) =>
    typeof value === "string" ? value.trim() : "";

const escapeRegex = (value = "") =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getParticipant = (participants = [], userRef) => {
    if (!userRef) return null;

    const userId = getUserIdFromRef(userRef);

    if (!userId) return null;

    return participants.find((p) => String(p?._id) === String(userId)) ?? null;
};

const getUserIdFromRef = (userRef) => {
    if (!userRef) return null;

    if (typeof userRef === "string") return userRef;

    if (typeof userRef === "object") {
        if (userRef?._id) return userRef._id;
        if (userRef?.id) return userRef.id;
        if (typeof userRef?.toString === "function") {
            const value = userRef.toString();
            if (value && value !== "[object Object]") return value;
        }
    }

    return null;
};

const getCurrentUserFirstName = (participants = [], currentUserId) => {
    if (!currentUserId) return "";

    const me = participants.find(
        (participant) => String(participant?._id) === String(currentUserId),
    );

    return me?.firstName || me?.fullName || "";
};

const formatFromServerText = ({
    text,
    action,
    currentUserId,
    participants = [],
}) => {
    const normalizedText = toCleanString(text);
    if (!normalizedText) return "Chat updated";

    const currentUserFirstName = getCurrentUserFirstName(
        participants,
        currentUserId,
    );
    const escapedName = escapeRegex(currentUserFirstName);

    if (action === "nickname_update") {
        if (
            normalizedText === "You cleared your own nickname" ||
            /^You set your nickname to\s*$/i.test(normalizedText)
        ) {
            return "You removed your nickname";
        }

        if (currentUserFirstName) {
            const removedOtherPattern = new RegExp(
                `^${escapedName} set the nickname for (.+) to\\s*$`,
                "i",
            );
            const removedOtherMatch = normalizedText.match(removedOtherPattern);
            if (removedOtherMatch) {
                const target = toCleanString(removedOtherMatch[1]);
                if (
                    target &&
                    target.toLowerCase() === currentUserFirstName.toLowerCase()
                ) {
                    return "You removed your nickname";
                }
                return `You removed the nickname for ${target || "someone"}`;
            }

            const setOtherPattern = new RegExp(
                `^${escapedName} set the nickname for (.+) to (.+)$`,
                "i",
            );
            const setOtherMatch = normalizedText.match(setOtherPattern);
            if (setOtherMatch) {
                const target = toCleanString(setOtherMatch[1]);
                const value = toCleanString(setOtherMatch[2]);

                if (
                    target &&
                    target.toLowerCase() === currentUserFirstName.toLowerCase()
                ) {
                    return value
                        ? `You set your nickname to ${value}`
                        : "You removed your nickname";
                }

                return value
                    ? `You set the nickname for ${target} to ${value}`
                    : `You removed the nickname for ${target}`;
            }
        }
    }

    if (action === "chatname_update") {
        if (
            normalizedText === "You cleared the chat name" ||
            /^You changed the chat name to\s*$/i.test(normalizedText)
        ) {
            return "You removed the chat name";
        }

        if (currentUserFirstName) {
            const setNamePattern = new RegExp(
                `^${escapedName} changed the chat name to (.+)$`,
                "i",
            );
            const setNameMatch = normalizedText.match(setNamePattern);
            if (setNameMatch) {
                const value = toCleanString(setNameMatch[1]);
                return value
                    ? `You changed the chat name to ${value}`
                    : "You removed the chat name";
            }

            const clearNamePattern = new RegExp(
                `^${escapedName} cleared the chat name$`,
                "i",
            );
            if (clearNamePattern.test(normalizedText)) {
                return "You removed the chat name";
            }
        }
    }

    return normalizedText;
};

const getParticipantLabel = ({
    userRef,
    currentUserId,
    participants = [],
    fallback = "Someone",
    useYou = true,
}) => {
    const participant = getParticipant(participants, userRef);
    const participantId = participant?._id ?? getUserIdFromRef(userRef);
    const rawUserLabel =
        typeof userRef === "object"
            ? userRef?.firstName || userRef?.fullName || ""
            : "";

    if (
        useYou &&
        participantId &&
        String(participantId) === String(currentUserId)
    ) {
        return "You";
    }

    if (!participant) return rawUserLabel || fallback;

    return participant.firstName || participant.fullName || fallback;
};

export function formatSystemMessage({
    message,
    currentUserId,
    participants = [],
}) {
    if (!message) return "";
    if (message.type !== "system") return message.text || "";

    const action = message.systemAction;
    const initiatorLabel = getParticipantLabel({
        userRef: message.initiator,
        currentUserId,
        participants,
        fallback: "Someone",
    });

    if (action === "nickname_update") {
        const hasStructuredNicknameData =
            Boolean(message?.initiator) &&
            Boolean(message?.targetUser) &&
            typeof message?.newValue === "string";

        if (!hasStructuredNicknameData) {
            return formatFromServerText({
                text: message.text,
                action,
                currentUserId,
                participants,
            });
        }

        const targetLabel = getParticipantLabel({
            userRef: message.targetUser,
            currentUserId,
            participants,
            fallback: "someone",
            useYou: false,
        });
        const nickname = toCleanString(message.newValue);
        const nicknameDisplay = nickname || REMOVED_NICKNAME_TEXT;

        return `${initiatorLabel} set the nickname for ${targetLabel} to ${nicknameDisplay}`;
    }

    if (action === "chatname_update") {
        const hasStructuredChatNameData =
            Boolean(message?.initiator) &&
            typeof message?.newValue === "string";

        if (!hasStructuredChatNameData) {
            return formatFromServerText({
                text: message.text,
                action,
                currentUserId,
                participants,
            });
        }

        const chatName = toCleanString(message.newValue);
        const chatNameDisplay = chatName || REMOVED_CHAT_NAME_TEXT;

        return `${initiatorLabel} updated the chat name to ${chatNameDisplay}`;
    }

    return formatFromServerText({
        text: message.text,
        action,
        currentUserId,
        participants,
    });
}
