import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { INTERFACE_PREFERENCES_KEY, readInterfacePreferences, saveInterfacePreferences } from "../src/lib/interfacePreferences.ts";

const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
let entries: Map<string, string>;
let storage: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void; removeItem: (key: string) => void };

beforeEach(() => {
  entries = new Map([["outra-chave", "preservar"]]);
  storage = {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => { entries.set(key, value); },
    removeItem: (key) => { entries.delete(key); },
  };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
});
afterEach(() => {
  if (original) Object.defineProperty(globalThis, "localStorage", original);
  else Reflect.deleteProperty(globalThis, "localStorage");
});

test("preferência ausente retorna null sem modificar outras chaves", () => {
  assert.equal(readInterfacePreferences(), null);
  assert.deepEqual([...entries], [["outra-chave", "preservar"]]);
});

test("carrega true e false com versão 1 e retorna somente os campos conhecidos", () => {
  for (const sidebarRecolhida of [true, false]) {
    entries.set(INTERFACE_PREFERENCES_KEY, JSON.stringify({ _versao: 1, sidebarRecolhida, adicional: "ignorado" }));
    assert.deepEqual(readInterfacePreferences(), { _versao: 1, sidebarRecolhida });
  }
});

test("descarta somente a chave de preferência quando JSON, formato ou versão são incompatíveis", () => {
  const invalid = [
    "{quebrado", "", "null", "false", "1", '"texto"', "[]", "{}",
    JSON.stringify([{ _versao: 1, sidebarRecolhida: true }]),
    JSON.stringify({ sidebarRecolhida: true }),
    JSON.stringify({ _versao: 1 }),
    ...[0, 2, "1", null].map((_versao) => JSON.stringify({ _versao, sidebarRecolhida: true })),
    ...[0, 1, "false", null, [], {}].map((sidebarRecolhida) => JSON.stringify({ _versao: 1, sidebarRecolhida })),
  ];
  for (const raw of invalid) {
    entries.set(INTERFACE_PREFERENCES_KEY, raw);
    assert.equal(readInterfacePreferences(), null, raw);
    assert.equal(entries.has(INTERFACE_PREFERENCES_KEY), false, raw);
    assert.equal(entries.get("outra-chave"), "preservar");
  }
});

test("grava somente versão e booleano sem alterar outras chaves", () => {
  for (const sidebarRecolhida of [false, true]) {
    saveInterfacePreferences(sidebarRecolhida);
    assert.deepEqual(JSON.parse(entries.get(INTERFACE_PREFERENCES_KEY)!), { _versao: 1, sidebarRecolhida });
    assert.equal(entries.get("outra-chave"), "preservar");
  }
});

test("falhas de leitura ou acesso ao storage retornam fallback sem descartar dados desconhecidos", () => {
  entries.set(INTERFACE_PREFERENCES_KEY, '{"_versao":1,"sidebarRecolhida":false}');
  storage.getItem = () => { throw new Error("indisponível"); };
  assert.equal(readInterfacePreferences(), null);
  assert.equal(entries.has(INTERFACE_PREFERENCES_KEY), true);
  Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("bloqueado"); } });
  assert.equal(readInterfacePreferences(), null);
  assert.doesNotThrow(() => saveInterfacePreferences(true));
});

test("falhas de remoção e gravação não escapam para a interface", () => {
  entries.set(INTERFACE_PREFERENCES_KEY, "inválido");
  storage.removeItem = () => { throw new Error("sem permissão"); };
  storage.setItem = () => { throw new Error("quota excedida"); };
  assert.equal(readInterfacePreferences(), null);
  assert.doesNotThrow(() => saveInterfacePreferences(true));
  assert.equal(entries.get("outra-chave"), "preservar");
});
