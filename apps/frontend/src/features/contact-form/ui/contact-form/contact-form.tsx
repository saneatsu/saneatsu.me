"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
	Button,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@/shared/ui";

import { fetchSubmitContactForm } from "../../api/submit-to-google-form";
import {
	CONTACT_CATEGORIES,
	type ContactFormValues,
	contactFormSchema,
} from "../../model/contact-form-schema";

/**
 * お問い合わせフォームコンポーネント
 *
 * 1. ユーザーがフォームに入力
 * 2. Zodスキーマでバリデーション
 *    - ハニーポットフィールドに値がある場合はスパムと見なしサイレントに成功扱い
 * 3. Google FormsのformResponseエンドポイントにPOST
 * 4. 送信中: ボタンがloading状態、フォームがdisabled
 * 5. 成功時: フォームをリセットしボタンに「送信しました」と表示
 * 6. 失敗時: toastでエラー通知
 */
export function ContactForm() {
	const t = useTranslations("contact");
	const [isSubmitted, setIsSubmitted] = useState(false);

	const form = useForm<ContactFormValues>({
		resolver: zodResolver(contactFormSchema),
		defaultValues: {
			name: "",
			company: "",
			jobTitle: "",
			email: "",
			subject: "",
			category: undefined,
			message: "",
			honeypot: "",
		},
	});

	const isSubmitting = form.formState.isSubmitting;

	/**
	 * フォーム送信ハンドラー
	 *
	 * 1. ハニーポットチェック（botはサイレントに成功扱い）
	 * 2. Google Formsに送信
	 * 3. 成功時: フォームリセット + ボタンを「送信しました」に変更
	 * 4. 失敗時: toast.errorで通知
	 */
	const onSubmit = useCallback(
		async (values: ContactFormValues) => {
			// 1. ハニーポットにデータが入っていればスパムと見なす
			if (values.honeypot) {
				form.reset();
				setIsSubmitted(true);
				return;
			}

			try {
				// 2. Google Formsに送信
				await fetchSubmitContactForm(values);
				// 3. 成功: フォームリセット + 成功状態に切り替え
				form.reset();
				setIsSubmitted(true);
			} catch {
				// 4. 失敗
				toast.error(t("error.submitFailed"));
			}
		},
		[form, t]
	);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<fieldset disabled={isSubmitting} className="space-y-6">
					{/* 名前 */}
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("name.label")}</FormLabel>
								<FormControl>
									<Input placeholder={t("name.placeholder")} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 会社名 */}
					<FormField
						control={form.control}
						name="company"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.label")}</FormLabel>
								<FormControl>
									<Input placeholder={t("company.placeholder")} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 役職（オプション） */}
					<FormField
						control={form.control}
						name="jobTitle"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("jobTitle.label")}</FormLabel>
								<FormControl>
									<Input placeholder={t("jobTitle.placeholder")} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* メールアドレス */}
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("email.label")}</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder={t("email.placeholder")}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* 件名 */}
					<FormField
						control={form.control}
						name="subject"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("subject.label")}</FormLabel>
								<FormControl>
									<Input placeholder={t("subject.placeholder")} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* カテゴリ */}
					<FormField
						control={form.control}
						name="category"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("category.label")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder={t("category.placeholder")} />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{CONTACT_CATEGORIES.map((category) => (
											<SelectItem key={category} value={category}>
												{t(`category.options.${category}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>

					{/* メッセージ */}
					<FormField
						control={form.control}
						name="message"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("message.label")}</FormLabel>
								<FormControl>
									<Textarea
										placeholder={t("message.placeholder")}
										rows={6}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</fieldset>

				{/* スパム防止用ハニーポットフィールド（ユーザーには見えない） */}
				<FormField
					control={form.control}
					name="honeypot"
					render={({ field }) => (
						<FormItem className="sr-only" aria-hidden="true">
							<FormLabel>このフィールドは入力しないでください</FormLabel>
							<FormControl>
								<Input {...field} tabIndex={-1} autoComplete="off" />
							</FormControl>
						</FormItem>
					)}
				/>

				<div className="flex justify-end">
					<Button type="submit" disabled={isSubmitting || isSubmitted}>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{t("submitting")}
							</>
						) : isSubmitted ? (
							<>
								<CheckCircle2 className="mr-2 h-4 w-4" />
								{t("submitted")}
							</>
						) : (
							<>
								<Send className="mr-2 h-4 w-4" />
								{t("submit")}
							</>
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
}
