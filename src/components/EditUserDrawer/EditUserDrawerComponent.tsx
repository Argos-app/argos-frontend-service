import { App, Alert, Button, Col, Drawer, Form, Input, Row, Select, Space } from "antd";
import axios from "axios";
import { useEffect } from "react";
import { useUserCreationOptions, useUserMutations } from "../../hooks/useUserManagement";
import type { UpdateUserPayload, User } from "../../types";

interface EditUserDrawerProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

type EditUserFormValues = UpdateUserPayload;

export function EditUserDrawer({ user, open, onClose, onUpdated }: EditUserDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<EditUserFormValues>();
  const { options, loading: loadingOptions, error: optionsError, retry } = useUserCreationOptions(open);
  const { pending: submitting, update } = useUserMutations();

  useEffect(() => {
    if (!open || !user) return;
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      cpf: user.cpf ?? "",
      permissionId: user.permissionId,
      currentPropertyId: user.properties[0]?.id,
      propertyId: user.properties[0]?.id,
    });
  }, [form, open, user]);

  const handleClose = () => {
    if (submitting) return;
    form.resetFields();
    onClose();
  };

  const handleSubmit = async (values: EditUserFormValues) => {
    if (!user) return;
    let validation;
    try {
      validation = await update(user.userId, values);
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      message.error(errorMessage ?? "Não foi possível atualizar o usuário.");
      return;
    }
    if (!validation.success) {
      form.setFields(Object.entries(validation.errors).map(([name, errors]) => ({ name: name as keyof EditUserFormValues, errors: errors ? [errors] : [] })));
      return;
    }
    message.success("Usuário atualizado com sucesso.");
    form.resetFields();
    onUpdated();
  };

  return (
    <Drawer
      title="Editar usuário"
      width={560}
      open={open}
      onClose={handleClose}
      rootClassName="argos-user-drawer"
      destroyOnHidden
      styles={{ body: { paddingBottom: 24 } }}
      extra={
        <Space>
          <Button onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            form="argos-edit-user-form"
            loading={submitting}
            disabled={!user || user.properties.length === 0 || optionsError || loadingOptions}
          >
            Salvar alterações
          </Button>
        </Space>
      }
    >
      {optionsError && (
        <Alert
          className="mb-5"
          type="error"
          showIcon
          message="Não foi possível carregar fazendas e permissões."
          action={
            <Button size="small" onClick={retry}>
              Tentar novamente
            </Button>
          }
        />
      )}

      <Form
        id="argos-edit-user-form"
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
        disabled={submitting || !user || user.properties.length === 0 || optionsError || loadingOptions}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="name"
              label="Nome"
              rules={[
                { required: true, whitespace: true, message: "Informe o nome." },
                { max: 120, message: "O nome deve ter até 120 caracteres." },
              ]}
            >
              <Input placeholder="Nome completo" autoComplete="name" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="email"
              label="E-mail"
              rules={[
                { required: true, message: "Informe o e-mail." },
                { type: "email", message: "Informe um e-mail válido." },
                { max: 120, message: "O e-mail deve ter até 120 caracteres." },
              ]}
            >
              <Input placeholder="nome@exemplo.com" autoComplete="email" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="cpf"
              label="CPF"
              rules={[
                { required: true, message: "Informe o CPF." },
                {
                  validator: async (_, value: string | undefined) => {
                    if (!value || /^\d{11}$/.test(value.replace(/\D/g, ""))) return;
                    throw new Error("Informe um CPF válido com 11 dígitos.");
                  },
                },
              ]}
            >
              <Input placeholder="000.000.000-00" maxLength={14} inputMode="numeric" autoComplete="off" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="currentPropertyId"
              label="Vínculo que deseja editar"
              rules={[{ required: true, message: "Selecione o vínculo atual." }]}
            >
              <Select
                disabled={user?.properties.length === 1}
                options={user?.properties.map(({ id, name }) => ({ value: id, label: name })) ?? []}
                onChange={(propertyId: string) => form.setFieldValue("propertyId", propertyId)}
                getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="propertyId"
              label="Fazenda de destino"
              rules={[{ required: true, message: "Selecione uma fazenda." }]}
            >
              <Select
                placeholder="Selecione uma fazenda"
                loading={loadingOptions}
                options={options.properties.map(({ id, name }) => ({ value: id, label: name }))}
                getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="permissionId"
              label="Permissão"
              rules={[{ required: true, message: "Selecione uma permissão." }]}
            >
              <Select
                placeholder="Selecione uma permissão"
                loading={loadingOptions}
                options={options.permissions.map(({ id, name }) => ({ value: id, label: name }))}
                getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
}
