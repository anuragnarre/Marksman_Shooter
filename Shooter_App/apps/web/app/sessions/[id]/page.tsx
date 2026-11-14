import SessionDetailPage from './SessionDetailClient';

export function generateStaticParams() {
  return [
    { id: 'live' },
    { id: 'sample' },
  ];
}

export default function Page() {
  return <SessionDetailPage />;
}
