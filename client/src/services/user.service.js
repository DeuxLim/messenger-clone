import { updatePasswordAPI, updateProfileAPI } from "../api/users.api";

export const updateProfile = async (data) => {
	const res = await updateProfileAPI(data);

	if (!res.updateSuccess) {
		throw new Error("failed to update profile...");
	}

	return res;
};

export const updatePassword = async (data) => {
	const res = await updatePasswordAPI(data);

	if (!res.updateSuccess) {
		throw new Error("failed to update password...");
	}

	return res;
};
