import ProtectedLayout from "@/components/Layout/ProtectedLayout";

export default function TaskListLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedLayout hideTopBarOnly={true}>
      {children}
    </ProtectedLayout>
  );
} 