import { App, Alert, Button, Col, Drawer, Form, Input, InputNumber, Row, Select, Space } from "antd";
import axios from "axios";
import { useEffect, useState } from "react";
import { createProperty, getAdministrators, updateProperty } from "../../services";
import type { AdminUserOption, Property, PropertyPayload } from "../../services";

interface PropertyFormDrawerProps {
  property: Property | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type PropertyFormValues = Omit<PropertyPayload, "cnpj" | "areaHectares" | "phone"> & {
  cnpj?: string;
  areaHectares?: number | null;
  phone?: string;
};

const states = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR",
  "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

async function getAllAdministrators() {
  const administrators: AdminUserOption[] = [];
  let page = 0;
  let last = false;

  while (!last) {
    const result = await getAdministrators(page, 100);
    administrators.push(...result.data);
    last = result.last || page + 1 >= result.totalPages;
    page += 1;
  }

  return administrators;
}

export function PropertyFormDrawer({ property, open, onClose, onSaved }: PropertyFormDrawerProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<PropertyFormValues>();
  const [administrators, setAdministrators] = useState<AdminUserOption[]>([]);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadedAttempt, setLoadedAttempt] = useState<number | null>(null);
  const [errorAttempt, setErrorAttempt] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadingAdministrators = open && loadedAttempt !== loadAttempt;
  const administratorsError = errorAttempt === loadAttempt;
  const editing = property !== null;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    getAllAdministrators()
      .then((result) => {
        if (!cancelled) {
          setAdministrators(result);
          setErrorAttempt(null);
        }
      })
      .catch(() => {
        if (!cancelled) setErrorAttempt(loadAttempt);
      })
      .finally(() => {
        if (!cancelled) setLoadedAttempt(loadAttempt);
      });

    return () => {
      cancelled = true;
    };
  }, [open, loadAttempt]);

  useEffect(() => {
    if (!open) return;
    if (!property) {
      form.resetFields();
      return;
    }
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
    setLoadAttempt((attempt) => attempt + 1);
    onClose();
  };

  const handleSubmit = async (values: PropertyFormValues) => {
    setSubmitting(true);
    const payload: PropertyPayload = {
      ...values,
      name: values.name.trim(),
      cnpj: values.cnpj?.trim() ? values.cnpj.replace(/\D/g, "") : null,
      address: values.address.trim(),
      city: values.city.trim(),
      state: values.state,
      areaHectares: values.areaHectares ?? null,
      phone: values.phone?.trim() || null,
    };

    try {
      if (property) {
        await updateProperty(property.id, payload);
        message.success("Propriedade atualizada com sucesso.");
      } else {
        await createProperty(payload);
        message.success("Propriedade cadastrada com sucesso.");
      }
      form.resetFields();
      onSaved();
    } catch (error: unknown) {
      const errorMessage = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message
        : undefined;
      message.error(errorMessage ?? "Não foi possível salvar a propriedade.");
    } finally {
      setSubmitting(false);
    }
  };

  const adminOptions: { value: string; label: string; disabled?: boolean }[] = administrators.map((administrator) => ({
    value: administrator.id,
    label: `${administrator.name} - ${administrator.email}`,
  }));
  if (property && !administrators.some(({ id }) => id === property.responsibleAdminId)) {
    adminOptions.push({
      value: property.responsibleAdminId,
      label: `${property.responsibleAdminName} (fora da lista de administradores ativos)`,
      disabled: true,
    });
  }

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
            <Button size="small" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
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
                    const digits = value.replace(/\D/g, "");
                    if (/^[\d./-]+$/.test(value) && digits.length === 14) return;
                    throw new Error("Informe um CNPJ com 14 dígitos.");
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
