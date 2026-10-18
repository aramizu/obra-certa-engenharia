import { describe, expect, it } from "vitest";
import {
  ROOM_SHORTCUTS,
  canAdvanceRoomsStep,
  emptyRoom,
  hasValidRoom,
  initialWizardRooms,
  isValidRoom,
  roomsContinueHint,
} from "@/lib/lista-wizard";

describe("wizard de cômodos", () => {
  it("começa vazio quando não há cômodos salvos", () => {
    expect(initialWizardRooms([])).toEqual([]);
  });

  it("mantém cômodos já salvos da obra", () => {
    const saved = [emptyRoom("Sala")];
    expect(initialWizardRooms(saved)).toBe(saved);
  });

  it("oferece atalhos dos ambientes típicos do apartamento", () => {
    expect([...ROOM_SHORTCUTS]).toEqual([
      "Sala",
      "Cozinha",
      "Banheiro",
      "Quarto",
      "Sacada",
      "Área de serviço",
    ]);
  });

  it("atalho cria cômodo só com o nome, sem medidas forçadas", () => {
    const room = emptyRoom("Cozinha");
    expect(room.name).toBe("Cozinha");
    expect(room.areaM2).toBe(0);
    expect(room.doors).toBe(0);
    expect(room.windows).toBe(0);
    expect(room.moduleIds).toEqual([]);
    expect(room.packageIds).toEqual([]);
  });

  it("cômodo válido precisa de nome", () => {
    expect(isValidRoom(emptyRoom())).toBe(false);
    expect(isValidRoom(emptyRoom("   "))).toBe(false);
    expect(isValidRoom(emptyRoom("Banheiro"))).toBe(true);
  });

  it("desabilita avançar até existir ao menos 1 cômodo válido", () => {
    expect(canAdvanceRoomsStep([])).toBe(false);
    expect(canAdvanceRoomsStep([emptyRoom()])).toBe(false);
    expect(canAdvanceRoomsStep([emptyRoom("Quarto")])).toBe(true);
    expect(hasValidRoom([emptyRoom(), emptyRoom("Sala")])).toBe(true);
  });

  it("explica o motivo de não avançar", () => {
    expect(roomsContinueHint([])).toBe("Adicione pelo menos um cômodo para continuar.");
    expect(roomsContinueHint([emptyRoom()])).toBe(
      "Informe o nome de pelo menos um cômodo para continuar."
    );
    expect(roomsContinueHint([emptyRoom("Sacada")])).toBeNull();
  });

  it("permite lista vazia depois de remover o último cômodo", () => {
    const last = emptyRoom("Sala");
    const remaining = [last].filter((room) => room.key !== last.key);
    expect(remaining).toEqual([]);
    expect(canAdvanceRoomsStep(remaining)).toBe(false);
  });
});
