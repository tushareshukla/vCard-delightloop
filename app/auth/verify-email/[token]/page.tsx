import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';
import Loading from './loading';

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function VerifyEmail({ params }: PageProps) {
  const { token } = await params;

  return (
    <Suspense fallback={<Loading />}>
      <VerifyEmailClient token={token} />
    </Suspense>
  );
}
