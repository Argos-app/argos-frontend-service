import { App, Alert, Button, Col, Drawer, Form, Input, InputNumber, Row, Select, Space } from "antd";
import axios from "axios";
import { isValidCNPJ } from "cnpj-cpf-validator";
import { useEffect, useMemo } from "react";
import { usePropertyAdministrators, usePropertyMutations } from "@/hooks/usePropertyManagement";
import type { Property, PropertyFormValues } from "@/types";

interface PropertyFormDrawerProps {
  property: Property | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const states = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR",
  "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export function PropertyFormDrawer({ property, open, onClose, onSaved }: PropertyFormDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<PropertyFormValues>();
  const {
    administrators,
    loading: loadingAdministrators,
    error: administratorsError,
    retry: retryAdministrators,
  } = usePropertyAdministrators(open);
  const { pending: submitting, save } = usePropertyMutations();
  const editing = property !== null;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (!property) return;
    form.setFieldsValue({
      name: property.name,
      cnpj: property.cnpj ?? "",
      address: property.address,
      city: property.city,
      state: property.state,
      areaHectares: property.areaHectares,
      phone: property.phone ?? "",
      responsibleAdminId: property.responsibleAdminId,
    });
  }, [form, open, property]);

  const handleClose = () => {
    if (submitting) return;
    form.resetFields();
    onClose();
  };

  const handleSubmit = async (values: PropertyFormValues) => {
    let validation;
    try {
      validation = await save(property, values);
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      message.error(errorMessage ?? "Não foi possível salvar a propriedade.");
      return;
    }
    if (!validation.success) {
      form.setFields(Object.entries(validation.errors).map(([name, errors]) => ({ name: name as keyof PropertyFormValues, errors: errors ? [errors] : [] })));
      return;
    }

    message.success(property ? "Propriedade atualizada com sucesso." : "Propriedade cadastrada com sucesso.");
    form.resetFields();
    onSaved();
  };

  const adminOptions = useMemo(() => {
    const options: { value: string; label: string; disabled?: boolean }[] = administrators.map((administrator) => ({
      value: administrator.id,
      label: `${administrator.name} - ${administrator.email}`,
    }));
    if (property && !administrators.some(({ id }) => id === property.responsibleAdminId)) {
      options.push({
        value: property.responsibleAdminId,
        label: property.responsibleAdminName,
        disabled: true,
      });
    }
    return options;
  }, [administrators, property]);

  const canSubmit = !loadingAdministrators && !administratorsError && administrators.length > 0;

  return (
    <Drawer
      title={editing ? "Editar propriedade" : "Adicionar propriedade"}
      width={560}
      open={open}
      onClose={handleClose}
      rootClassName="argos-property-drawer"
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
            form="argos-property-form"
            loading={submitting}
            disabled={!canSubmit}
          >
            {editing ? "Salvar alterações" : "Cadastrar propriedade"}
          </Button>
        </Space>
      }
    >
      {administratorsError && (
        <Alert
          className="mb-5"
          type="error"
          showIcon
          message="Não foi possível carregar os administradores."
          action={
            <Button size="small" onClick={retryAdministrators}>
              Tentar novamente
            </Button>
          }
        />
      )}
      {!administratorsError && !loadingAdministrators && administrators.length === 0 && (
        <Alert
          className="mb-5"
          type="warning"
          showIcon
          message="Cadastre ao menos um administrador ativo antes de cadastrar propriedades."
        />
      )}

      <Form
        id="argos-property-form"
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
        disabled={submitting || loadingAdministrators || administratorsError || administrators.length === 0}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="name"
              label="Nome da fazenda"
              rules={[
                { required: true, whitespace: true, message: "Informe o nome da fazenda." },
                { max: 120, message: "O nome deve ter até 120 caracteres." },
              ]}
            >
              <Input placeholder="Nome da fazenda" maxLength={120} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="cnpj"
              label="CNPJ"
              rules={[
                {
                  validator: async (_, value?: string) => {
                    if (!value?.trim()) return;
                    if (isValidCNPJ(value)) return;
                    throw new Error("Informe um CNPJ válido.");
                  },
                },
              ]}
            >
              <Input placeholder="00.000.000/0000-00" maxLength={18} inputMode="numeric" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="phone"
              label="Telefone"
              rules={[{ max: 20, message: "O telefone deve ter até 20 caracteres." }]}
            >
              <Input placeholder="(00) 00000-0000" maxLength={20} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="address"
              label="Endereço"
              rules={[
                { required: true, whitespace: true, message: "Informe o endereço." },
                { max: 255, message: "O endereço deve ter até 255 caracteres." },
              ]}
            >
              <Input placeholder="Rua, número e complemento" maxLength={255} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="city"
              label="Cidade"
              rules={[
                { required: true, whitespace: true, message: "Informe a cidade." },
                { max: 100, message: "A cidade deve ter até 100 caracteres." },
              ]}
            >
              <Input placeholder="Cidade" maxLength={100} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="state" label="Estado" rules={[{ required: true, message: "Selecione o estado." }]}>
              <Select
                placeholder="Selecione a UF"
                options={states.map((state) => ({ value: state, label: state }))}
                getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="areaHectares"
              label="Área em hectares"
              rules={[
                {
                  validator: async (_, value?: number | null) => {
                    if (value == null || value > 0) return;
                    throw new Error("A área deve ser maior que zero.");
                  },
                },
              ]}
            >
              <InputNumber
                className="w-full"
                min={0.01}
                precision={2}
                placeholder="Ex.: 125,50"
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="responsibleAdminId"
              label="Administrador responsável"
              rules={[{ required: true, message: "Selecione o administrador responsável." }]}
            >
              <Select
                showSearch
                loading={loadingAdministrators}
                placeholder="Selecione o administrador"
                options={adminOptions}
                filterOption={(input, option) => String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
}
