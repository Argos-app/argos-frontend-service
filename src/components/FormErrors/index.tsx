import Form from "antd/es/form";

export function FormErrors() {
  return (
    <Form.Item noStyle shouldUpdate>
      {({ getFieldsError }) => (
        <p role="alert" className="sr-only">
          {getFieldsError().flatMap(({ errors }) => errors).join(" ")}
        </p>
      )}
    </Form.Item>
  );
}
