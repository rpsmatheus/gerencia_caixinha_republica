import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { apiGetMock, apiPostMock, apiPutMock, apiDeleteMock } = vi.hoisted(
  () => ({
    apiGetMock: vi.fn(),
    apiPostMock: vi.fn(),
    apiPutMock: vi.fn(),
    apiDeleteMock: vi.fn(),
  }),
);

vi.mock("../../src/services/api", () => ({
  default: {
    get: apiGetMock,
    post: apiPostMock,
    put: apiPutMock,
    delete: apiDeleteMock,
  },
}));

vi.mock("../../src/hooks/usePermissions", () => ({
  usePermissions: () => ({
    canManageExpenses: true,
    canManageCategories: true,
  }),
}));

const { default: Expenses } = await import("../../src/pages/Expenses");

const expensesResponse = {
  data: {
    data: [
      {
        id: "expense-1",
        description: "Conta de luz",
        category: "Utilidades",
        amount: 150,
        expenseDate: "2026-07-10",
        hasProof: true,
        proofOriginalName: "foto.png",
        createdAt: "2026-07-10T00:00:00.000Z",
        updatedAt: "2026-07-10T00:00:00.000Z",
      },
    ],
  },
};

const categoriesResponse = {
  data: {
    data: [{ id: "cat-1", name: "Utilidades" }],
  },
};

const proofBlob = new Blob(["fake image"], { type: "image/png" });
const windowOpenMock = vi.fn();
const createObjectURLMock = vi.fn(() => "blob:proof");
const revokeObjectURLMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  apiGetMock.mockImplementation((url: string) => {
    if (url === "/api/expenses/expense-1/proof") {
      return Promise.resolve({ data: proofBlob });
    }
    if (url === "/api/categories") {
      return Promise.resolve(categoriesResponse);
    }
    return Promise.resolve(expensesResponse);
  });

  Object.defineProperty(window, "open", {
    configurable: true,
    value: windowOpenMock,
  });
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: createObjectURLMock,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revokeObjectURLMock,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Expenses page", () => {
  it("visualiza o comprovante existente sem abrir a edição da despesa", async () => {
    const user = userEvent.setup();
    render(<Expenses />);

    expect(await screen.findByText("Conta de luz")).toBeInTheDocument();

    await user.click(screen.getByTitle("Visualizar comprovante"));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/api/expenses/expense-1/proof", {
        responseType: "blob",
      });
    });
    expect(createObjectURLMock).toHaveBeenCalledWith(proofBlob);
    expect(windowOpenMock).toHaveBeenCalledWith("blob:proof", "_blank");
    expect(
      screen.queryByRole("heading", { name: "Editar Despesa" }),
    ).not.toBeInTheDocument();
  });
});
