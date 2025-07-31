import ProtectedLayout from "@/components/Layout/ProtectedLayout";

export default function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
} 