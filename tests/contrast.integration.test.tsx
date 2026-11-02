// @vitest-environment node
import { readFileSync } from "node:fs";
import { theme } from "antd";
import { expect, test } from "vitest";

const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
const seed = Object.fromEntries([...main.matchAll(/\b(color\w+): "(#[\da-f]{6})"/gi)].map(([, name, value]) => [name, value]));
const tokens = theme.getDesignToken({ token: seed });
const brand = (name: string) => css.match(new RegExp(`--color-brand-${name}: (#[\\da-f]{6})`, "i"))![1];
const cream = brand("cream"), forest = brand("forest"), ink = brand("ink"), sand = brand("sand"), leaf = brand("leaf");

function rgb(value: string, backdrop = [1, 1, 1]): number[] {
  const parts = value.startsWith("#")
    ? value.slice(1).match(/../g)!.map((part) => parseInt(part, 16))
    : value.match(/[\d.]+/g)!.map(Number);
  const alpha = parts[3] ?? 1;
  return parts.slice(0, 3).map((channel, i) => channel / 255 * alpha + backdrop[i] * (1 - alpha));
}

function blend(foreground: string, background: string, alpha: number): string {
  const bg = rgb(background);
  return `rgb(${rgb(foreground).map((channel, i) => (channel * alpha + bg[i] * (1 - alpha)) * 255).join(",")})`;
}

function contrast(foreground: string, background: string): number {
  const bg = rgb(background);
  const luminance = (channels: number[]) => channels
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, i) => sum + channel * [0.2126, 0.7152, 0.0722][i], 0);
  const first = luminance(rgb(foreground, bg)), second = luminance(bg);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

test("cálculo é calibrado por preto/branco e cores idênticas", () => {
  expect(contrast("#000000", "#ffffff")).toBe(21);
  expect(contrast(forest, forest)).toBe(1);
  expect(contrast(blend("#000000", "#ffffff", 0.5), "#ffffff")).toBeCloseTo(3.977, 2);
});

const pairs: [string, string, string, number][] = [
  ["texto principal", ink, cream, 4.5],
  ["texto secundário e erros dos drawers", forest, cream, 4.5],
  ["erro padrão sobre creme", tokens.colorError, cream, 4.5],
  ["erro padrão sobre branco", tokens.colorError, "#ffffff", 4.5],
  ["placeholder sobre creme", tokens.colorTextPlaceholder, cream, 4.5],
  ["placeholder sobre branco", tokens.colorTextPlaceholder, "#ffffff", 4.5],
  ["botão primário", cream, tokens.colorPrimary, 4.5],
  ["botão primário em hover", cream, tokens.colorPrimaryHover, 4.5],
  ["botão próprio em hover", ink, leaf, 4.5],
  ["texto forest a 80%", blend(forest, cream, 0.8), cream, 4.5],
  ["cabeçalho das tabelas", forest, blend(sand, cream, 0.3), 4.5],
  ["linhas das tabelas em hover", forest, blend(sand, cream, 0.2), 4.5],
  ["status ativo", forest, blend(leaf, cream, 0.2), 4.5],
  ["status inativo", forest, blend(sand, cream, 0.5), 4.5],
  ["cards de IA", forest, blend("#ffffff", cream, 0.5), 4.5],
  ["alerta de dados desatualizados", tokens.colorText, tokens.colorWarningBg, 4.5],
  ["título de alerta de dados desatualizados", tokens.colorTextHeading, tokens.colorWarningBg, 4.5],
  ["título de alerta de erro", tokens.colorTextHeading, tokens.colorErrorBg, 4.5],
  ["descrição de alerta de erro", tokens.colorText, tokens.colorErrorBg, 4.5],
  ["alerta informativo", tokens.colorText, tokens.colorInfoBg, 4.5],
  ["link em hover", tokens.colorLinkHover, cream, 4.5],
  ["borda dos campos", tokens.colorBorder, cream, 3],
  ["indicador de foco", forest, cream, 3],
  ["link de salto", "#000000", "#ffffff", 4.5],
];

test.each(pairs)("%s atende contraste mínimo", (_name, foreground, background, minimum) => {
  expect(contrast(foreground, background)).toBeGreaterThanOrEqual(minimum);
});
