import { render, screen, fireEvent } from "@testing-library/react";
import { PricingCards } from "../components/pricing-cards";

describe("PricingCards", () => {
  it("renders all three plans", () => {
    render(<PricingCards />);
    expect(screen.getByText("Solo")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Agency")).toBeInTheDocument();
  });

  it("renders prices for each plan", () => {
    render(<PricingCards />);
    expect(screen.getByText("$29")).toBeInTheDocument();
    expect(screen.getByText("$79")).toBeInTheDocument();
    expect(screen.getByText("$199")).toBeInTheDocument();
  });

  it("shows Most Popular badge on Team plan", () => {
    render(<PricingCards />);
    expect(screen.getByText("Most Popular")).toBeInTheDocument();
  });

  it("marks current plan button as disabled", () => {
    render(<PricingCards currentPlan="solo" />);
    const buttons = screen.getAllByRole("button");
    const soloButton = buttons.find((btn) => btn.textContent === "Current Plan");
    expect(soloButton).toBeDisabled();
  });

  it("calls onSelect with plan when button clicked", () => {
    const onSelect = jest.fn();
    render(<PricingCards onSelect={onSelect} />);
    const buttons = screen.getAllByText("Select Plan");
    fireEvent.click(buttons[0]);
    expect(onSelect).toHaveBeenCalledWith("solo");
  });

  it("shows feature lists", () => {
    render(<PricingCards />);
    expect(screen.getByText("Up to 10 listings")).toBeInTheDocument();
    expect(screen.getByText("5 users")).toBeInTheDocument();
    expect(screen.getByText("Unlimited listings")).toBeInTheDocument();
  });

  it("disables all buttons when isLoading", () => {
    render(<PricingCards isLoading />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });
});
