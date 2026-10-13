import { Alert, App, Button, Drawer, Form, Select, Space, Typography } from "antd";
import axios from "axios";
import { useEffect } from "react";
import type { UserAccess } from "@/types";
import { usePermissionOptions, useUserAccessMutation } from "@/hooks/useUserManagement";

interface EditAccessDrawerProps {
  user: UserAccess | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

interface FormValues { permissionId: string }

export function EditAccessDrawer({ user, open, onClose, onUpdated }: EditAccessDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const { options, loading: loadingOptions, error, retry } = usePermissionOptions(open);
  const { pending, updateAccess } = useUserAccessMutation();

  useEffect(() => {
    if (!open || !user) return;
    form.resetFields();
    form.setFieldsValue({ permissionId: user.permissionId });
  }, [form, open, user]);

  const close = () => {
    if (pending) return;
    form.resetFields();
    onClose();
  };

  const submit = async ({ permissionId }: FormValues) => {
    if (!user || permissionId === user.permissionId) return;
    try {
      const result = await updateAccess(user.userId, { permissionId });
      if (!result.success) {
        const permissionError = result.errors.permissionId;
        if (permissionError) form.setFields([{ name: "permissionId", errors: [permissionError] }]);
        return;
      }
      message.success("Acesso atualizado com sucesso.");
      form.resetFields();
      onUpdated();
    } catch (cause: unknown) {
      const errorMessage = axios.isAxiosError<{ message?: string }>(cause) ? cause.response?.data?.message : undefined;
      message.error(errorMessage ?? "Não foi possível atualizar o acesso.");
    }
  };

  const permissionOptions: { value: string; label: string; disabled?: boolean }[] = options.map(({ id, name }) => ({ value: id, label: name }));
  if (user && !options.some(({ id }) => id === user.permissionId)) permissionOptions.unshift({ value: user.permissionId, label: `${user.permissionName} (inativa)`, disabled: true });

  return (
    <Drawer title="Editar acesso" width={480} open={open} onClose={close} destroyOnHidden styles={{ body: { paddingBottom: 24 } }}
      extra={<Space><Button onClick={close} disabled={pending}>Cancelar</Button><Button type="primary" htmlType="submit" form="argos-edit-access-form" loading={pending} disabled={!user || error || loadingOptions || options.length === 0}>Salvar alterações</Button></Space>}>
      <Typography.Paragraph className="text-brand-forest">{user?.name} - {user?.email}</Typography.Paragraph>
      <Alert className="mb-5" type="info" showIcon message="Cada usuário pode ter apenas uma permissão. Ao salvar, o acesso atual será substituído." />
      {error && <Alert className="mb-5" type="error" showIcon message="Não foi possível carregar as permissões." action={<Button size="small" onClick={retry}>Tentar novamente</Button>} />}
      {!error && !loadingOptions && options.length === 0 && <Alert className="mb-5" type="warning" showIcon message="Nenhuma permissão ativa está disponível para atribuição." />}
      <Form id="argos-edit-access-form" form={form} layout="vertical" requiredMark={false} onFinish={submit} disabled={pending || !user || error || loadingOptions}>
        <Form.Item name="permissionId" label="Acesso" rules={[{ required: true, message: "Selecione uma permissão." }]}>
          <Select placeholder="Selecione uma permissão" loading={loadingOptions} options={permissionOptions} getPopupContainer={(trigger) => trigger.parentElement ?? document.body} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
