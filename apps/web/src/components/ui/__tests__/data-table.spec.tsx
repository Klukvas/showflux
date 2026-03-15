import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, type Column } from '../data-table';

interface Item {
  id: string;
  name: string;
  age: number;
}

const columns: Column<Item>[] = [
  { key: 'name', header: 'Name', render: (item) => item.name },
  { key: 'age', header: 'Age', render: (item) => item.age },
];

const data: Item[] = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
];

describe('DataTable', () => {
  it('renders column headers', () => {
    render(
      <DataTable columns={columns} data={data} isLoading={false} keyExtractor={(i) => i.id} />,
    );
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(
      <DataTable columns={columns} data={data} isLoading={false} keyExtractor={(i) => i.id} />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders custom column render', () => {
    const customCols: Column<Item>[] = [
      { key: 'name', header: 'Name', render: (item) => <strong>{item.name}</strong> },
    ];
    render(
      <DataTable columns={customCols} data={data} isLoading={false} keyExtractor={(i) => i.id} />,
    );
    expect(screen.getByText('Alice').tagName).toBe('STRONG');
  });

  it('shows loading skeleton', () => {
    const { container } = render(
      <DataTable columns={columns} data={null} isLoading keyExtractor={(i) => i.id} />,
    );
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no data', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        isLoading={false}
        keyExtractor={(i) => i.id}
        emptyTitle="Nothing here"
        emptyDescription="Add some data"
      />,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Add some data')).toBeInTheDocument();
  });

  it('shows default empty title', () => {
    render(
      <DataTable columns={columns} data={[]} isLoading={false} keyExtractor={(i) => i.id} />,
    );
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });

  it('calls onRowClick when row is clicked', async () => {
    const user = userEvent.setup();
    const onRowClick = jest.fn();
    render(
      <DataTable
        columns={columns}
        data={data}
        isLoading={false}
        keyExtractor={(i) => i.id}
        onRowClick={onRowClick}
      />,
    );
    await user.click(screen.getByText('Alice'));
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('shows empty state when data is null', () => {
    render(
      <DataTable columns={columns} data={null} isLoading={false} keyExtractor={(i) => i.id} />,
    );
    expect(screen.getByText('No data found')).toBeInTheDocument();
  });
});
