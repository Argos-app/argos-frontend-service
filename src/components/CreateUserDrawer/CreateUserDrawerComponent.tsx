import { App, Alert, Button, Col, Drawer, Form, Input, Row, Select, Space } from "antd";
import { useEffect, useState } from "react";
import { createUser, getUserCreationOptions, type CreateUserPayload, type UserCreationOptions } from "../../services";
import axios from "axios";

interface CreateUserDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type CreateUserFormValues = CreateUserPayload;

export function CreateUserDrawer({ open, onClose, onCreated }: CreateUserDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateUserFormValues>();
  const [options, setOptions] = useState<UserCreationOptions>({ properties: [], permissions: [] });
  const [optionsAttempt, setOptionsAttempt] = useState(0);
  const [completedOptionsAttempt, setCompletedOptionsAttempt] = useState<number | null>(null);
  const [optionsErrorAttempt, setOptionsErrorAttempt] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const loadingOptions = open && completedOptionsAttempt !== optionsAttempt;
  const optionsError = optionsErrorAttempt === optionsAttempt;

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    getUserCreationOptions()
      .then((result) => {
        if (!cancelled) {
          setOptions(result);
          setOptionsErrorAttempt(null);
        }
      })
      .catch(() => {
        if (!cancelled) setOptionsErrorAttempt(optionsAttempt);
      })
      .finally(() => {
        if (!cancelled) setCompletedOptionsAttempt(optionsAttempt);
      });

    return () => {
      cancelled = true;
    };
  }, [open, optionsAttempt]);

  const handleClose = () => {
    if (submitting) return;
    form.resetFields();
    setOptionsAttempt((attempt) => attempt + 1);
    onClose();
  };

  const handleSubmit = async (values: CreateUserFormValues) => {
    setSubmitting(true);
    try {
      await createUser({ ...values, cpf: values.cpf.replace(/\D/g, "") });
      message.success("Usuário criado com sucesso.");
      form.resetFields();
      setOptionsAttempt((attempt) => attempt + 1);
      onCreated();
    } catch (error) {
      const errorMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title="Adicionar usuário"
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
          <Button type="primary" htmlType="submit" form="argos-create-user-form" loading={submitting}>
            Criar usuário
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
          action={<Button size="small" onClick={() => setOptionsAttempt((attempt) => attempt + 1)}>Tentar novamente</Button>}
        />
      )}
      {!optionsError && (options.properties.length === 0 || options.permissions.length === 0) && !loadingOptions && (
        <Alert
          className="mb-5"
          type="warning"
          showIcon
          message="Cadastre ao menos uma fazenda e uma permissão ativa antes de criar um usuário."
        />
      )}

      <Form
        id="argos-create-user-form"
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
        disabled={submitting || optionsError || loadingOptions}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="name" label="Nome" rules={[{ required: true, whitespace: true, message: "Informe o nome." }, { max: 120, message: "O nome deve ter até 120 caracteres." }]}>
              <Input placeholder="Nome completo" autoComplete="name" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="email" label="E-mail" rules={[{ required: true, message: "Informe o e-mail." }, { type: "email", message: "Informe um e-mail válido." }, { max: 120, message: "O e-mail deve ter até 120 caracteres." }]}>
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
          <Col xs={24} md={12}>
            <Form.Item name="password" label="Senha inicial" rules={[{ required: true, message: "Informe a senha inicial." }, { min: 8, message: "A senha deve ter pelo menos 8 caracteres." }, { max: 128, message: "A senha deve ter até 128 caracteres." }]}>
              <Input.Password placeholder="Mínimo de 8 caracteres" autoComplete="new-password" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="propertyId" label="Fazenda" rules={[{ required: true, message: "Selecione uma fazenda." }]}>
              <Select
                placeholder="Selecione uma fazenda"
                loading={loadingOptions}
                options={options.properties.map(({ id, name }) => ({ value: id, label: name }))}
                getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="permissionId" label="Permissão" rules={[{ required: true, message: "Selecione uma permissão." }]}>
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
