import { App, Switch } from "antd";
import { useState } from "react";
import type { UserAccess } from "@/types";
import axios from "axios";
import { useLifetime } from "@/hooks/useLifetime";

interface ToggleUserStatusButtonProps {
	user: UserAccess;
	onToggle: (user: UserAccess, active: boolean) => Promise<void>;
}

export function ToggleUserStatusButton({ user, onToggle }: ToggleUserStatusButtonProps) {
	const { message } = App.useApp();
	const [pending, setPending] = useState(false);
	const lifetime = useLifetime();

	const handleChange = async (active: boolean) => {
		const owner = lifetime.current;
		if (!owner || pending) return;
		setPending(true);
		try {
			await onToggle(user, active);
			if (lifetime.current !== owner) return;
			message.success(
				active ? "Usuário ativado com sucesso." : "Usuário desativado com sucesso.",
			);
		} catch (error: unknown) {
			if (lifetime.current !== owner) return;
			let errorMessage: string = "Não foi possível atualizar o status. Tente novamente.";
			if (
				axios.isAxiosError<{ message?: unknown }>(error) &&
				error.response?.status === 409
			) {
				const errorMessageResponse = error.response.data?.message;
				if (typeof errorMessageResponse === "string" && errorMessageResponse.trim()) {
					errorMessage = errorMessageResponse;
				}
			}

			message.error(errorMessage);
		} finally {
			if (lifetime.current === owner) setPending(false);
		}
	};

	return (
		<Switch
			checked={user.active}
			aria-busy={pending}
			aria-disabled={pending}
			onChange={handleChange}
			aria-label={`${user.active ? "Desativar" : "Ativar"} usuário ${user.name}`}
			checkedChildren={pending ? "Salvando…" : "Ativo"}
			unCheckedChildren={pending ? "Salvando…" : "Inativo"}
			className="focus-visible:outline-2 focus-visible:outline-offset-2"
		/>
	);
}
