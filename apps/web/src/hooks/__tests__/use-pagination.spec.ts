import { renderHook, act } from "@testing-library/react";
import { usePagination } from "../use-pagination";

describe("usePagination", () => {
  it("calculates totalPages correctly", () => {
    const onPageChange = jest.fn();
    const { result } = renderHook(() =>
      usePagination({ total: 25, page: 1, limit: 10, onPageChange }),
    );
    expect(result.current.totalPages).toBe(3);
  });

  it("returns at least 1 totalPages for empty dataset", () => {
    const onPageChange = jest.fn();
    const { result } = renderHook(() =>
      usePagination({ total: 0, page: 1, limit: 10, onPageChange }),
    );
    expect(result.current.totalPages).toBe(1);
  });

  it("sets hasNext / hasPrev correctly", () => {
    const onPageChange = jest.fn();
    const { result } = renderHook(() =>
      usePagination({ total: 30, page: 2, limit: 10, onPageChange }),
    );
    expect(result.current.hasNext).toBe(true);
    expect(result.current.hasPrev).toBe(true);
  });

  it("hasNext is false on last page", () => {
    const onPageChange = jest.fn();
    const { result } = renderHook(() =>
      usePagination({ total: 20, page: 2, limit: 10, onPageChange }),
    );
    expect(result.current.hasNext).toBe(false);
  });

  it("hasPrev is false on first page", () => {
    const onPageChange = jest.fn();
    const { result } = renderHook(() =>
      usePagination({ total: 20, page: 1, limit: 10, onPageChange }),
    );
    expect(result.current.hasPrev).toBe(false);
  });

  it("nextPage calls onPageChange with page + 1", () => {
    const onPageChange = jest.fn();
    const { result } = renderHook(() =>
      usePagination({ total: 30, page: 1, limit: 10, onPageChange }),
    );
    act(() => result.current.nextPage());
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("prevPage calls onPageChange with page - 1", () => {
    const onPageChange = jest.fn();
    const { result } = renderHook(() =>
      usePagination({ total: 30, page: 2, limit: 10, onPageChange }),
    );
    act(() => result.current.prevPage());
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("goToPage clamps to valid range", () => {
    const onPageChange = jest.fn();
    const { result } = renderHook(() =>
      usePagination({ total: 20, page: 1, limit: 10, onPageChange }),
    );

    act(() => result.current.goToPage(0));
    expect(onPageChange).not.toHaveBeenCalled();

    act(() => result.current.goToPage(99));
    expect(onPageChange).not.toHaveBeenCalled();

    act(() => result.current.goToPage(2));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("nextPage does nothing on last page", () => {
    const onPageChange = jest.fn();
    const { result } = renderHook(() =>
      usePagination({ total: 10, page: 1, limit: 10, onPageChange }),
    );
    act(() => result.current.nextPage());
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("prevPage does nothing on first page", () => {
    const onPageChange = jest.fn();
    const { result } = renderHook(() =>
      usePagination({ total: 20, page: 1, limit: 10, onPageChange }),
    );
    act(() => result.current.prevPage());
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("uses ITEMS_PER_PAGE as default limit", () => {
    const onPageChange = jest.fn();
    // ITEMS_PER_PAGE = 10, so 25 items => 3 pages
    const { result } = renderHook(() =>
      usePagination({ total: 25, page: 1, onPageChange }),
    );
    expect(result.current.totalPages).toBe(3);
  });
});
