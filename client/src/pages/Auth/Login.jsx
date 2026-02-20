import { useId, useState } from "react";
import { Link, useNavigate } from "react-router";
import FormInput from "../../components/auth/FormInput";
import { IoEyeOffOutline } from "react-icons/io5";
import { IoEyeOutline } from "react-icons/io5";
import { isEmpty } from "../../utilities/utils";
import useAuth from "../../contexts/auth/useAuth";
import { loginService } from "../../services/auth.service";
import useToast from "../../contexts/ui/useToast";
import { getErrorMessage } from "../../utilities/errors";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const elementUserEmailId = useId();
    const elementPasswordId = useId();
    const elementRememberMeId = useId();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const toast = useToast();

    function validateForm() {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email.trim()) {
            newErrors.email = "Email cannot be empty";
        } else if (!emailRegex.test(email.trim())) {
            newErrors.email = "Enter a valid email address";
        }

        if (!password.trim()) {
            newErrors.password = "Password cannot be empty";
        }

        return newErrors;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const validationErrors = validateForm();
        setErrors(validationErrors);
        if (!isEmpty(validationErrors)) return;

        setLoading(true);
        setErrors({});

        try {
            const { user, accessToken } = await loginService({
                email,
                password,
                rememberMe,
            });

            login(user, accessToken); // context state only
            navigate("/chats");
        } catch (err) {
            const message = getErrorMessage(err, "Login failed");
            toast.error(message);
            setErrors({ general: message });
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-8 text-lg w-80">
                <div className="flex flex-col gap-3">

                    {/* EMAIL */}
                    <FormInput
                        id={elementUserEmailId}
                        type="email"
                        name="user-email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                        }}
                        error={errors.email}
                    />

                    <div className="relative flex items-center justify-center w-full">
                        <FormInput
                            id={elementPasswordId}
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) setErrors(prev => ({ ...prev, password: null }));
                            }}
                            error={errors.password}
                            additionalContainerClasses="w-full"
                        />

                        {/* Show / Hide Password */}
                        {password ? (
                            <div
                                className="absolute right-4"
                                onClick={() => setShowPassword(prev => !prev)}
                            >
                                {showPassword ? <IoEyeOutline /> : <IoEyeOffOutline />}
                            </div>
                        ) : ""}

                    </div>
                </div>

                {errors.general &&
                    <div className="flex justify-center text-red-500">
                        <p>{errors.general}</p>
                    </div>
                }

                {/* SUBMIT */}
                <div className="flex flex-col justify-center items-center w-full">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`bg-blue-500 py-3 px-6 rounded-full text-sm
                                        ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        <span className="text-white">
                            {loading ? "Logging in..." : "Continue"}
                        </span>
                    </button>
                </div>

                {/* REMEMBER ME && FORGOT PASSWORD*/}
                <div className="flex text-sm justify-center items-center mt-2 px-1">
                    <label htmlFor={elementRememberMeId} className="flex items-center gap-2 cursor-pointer text-gray-500">
                        <input
                            type="checkbox"
                            id={elementRememberMeId}
                            name="remember-me"
                            className="hidden peer"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <div className="relative size-4.5 border border-gray-400 text-gray-500 rounded peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all duration-200"></div>
                        <span className="text-sm text-gray-500">Keep me signed in</span>
                    </label>
                </div>
            </div>
        </form>
    );
}
