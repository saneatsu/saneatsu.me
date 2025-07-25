import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuthStore } from "../../model/auth-store";

/**
 * ログインフォームのバリデーションスキーマ
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスは必須です")
    .email("有効なメールアドレスを入力してください"),
  password: z
    .string()
    .min(1, "パスワードは必須です")
    .min(8, "パスワードは8文字以上で入力してください"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  /** フォームのサイズ */
  variant?: "default" | "compact";
  /** 登録画面への切り替えコールバック */
  onSwitchToRegister?: () => void;
  /** ログイン成功時のコールバック */
  onSuccess?: () => void;
  /** 追加のCSS classes */
  className?: string;
}

/**
 * ログインフォームコンポーネント
 */
export function LoginForm({
  variant = "default",
  onSwitchToRegister,
  onSuccess,
  className,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      onSuccess?.();
    } catch (error) {
      // エラーはストアで管理されるため、ここでは何もしない
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <div className={`space-y-6 ${className || ""}`}>
      <div className="text-center">
        <h2 className={`font-bold text-gray-900 ${
          variant === "compact" ? "text-xl" : "text-2xl"
        }`}>
          ログイン
        </h2>
        <p className={`text-gray-600 ${
          variant === "compact" ? "text-sm mt-1" : "text-base mt-2"
        }`}>
          アカウントにログインしてください
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* メールアドレス */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className={`
              mt-1 block w-full px-3 py-2 border rounded-md shadow-sm 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${errors.email 
                ? "border-red-300 text-red-900 placeholder-red-300" 
                : "border-gray-300"
              }
              ${variant === "compact" ? "text-sm" : ""}
            `}
            placeholder="example@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* パスワード */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            パスワード
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className={`
                block w-full px-3 py-2 pr-10 border rounded-md shadow-sm 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${errors.password 
                  ? "border-red-300 text-red-900 placeholder-red-300" 
                  : "border-gray-300"
                }
                ${variant === "compact" ? "text-sm" : ""}
              `}
              placeholder="パスワードを入力"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* ログインボタン */}
        <button
          type="submit"
          disabled={isFormLoading}
          className={`
            w-full flex justify-center py-2 px-4 border border-transparent 
            rounded-md shadow-sm text-sm font-medium text-white 
            bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
            focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 
            disabled:cursor-not-allowed
            ${variant === "compact" ? "py-2" : "py-3"}
          `}
        >
          {isFormLoading ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      {/* 登録画面への切り替え */}
      {onSwitchToRegister && (
        <div className="text-center">
          <p className={`text-gray-600 ${variant === "compact" ? "text-sm" : ""}`}>
            アカウントをお持ちでない方は{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              新規登録
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
