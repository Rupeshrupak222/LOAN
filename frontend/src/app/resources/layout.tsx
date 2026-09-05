import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Adyapan Resources | The Intelligence Hub',
  description:
    'Ideas for the financial systems being built next. Explore insights, explainers and practical perspectives across lending, banking, payments, risk and financial technology.',
};

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
