import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';
import Loading from './loading';

interface PageProps {
  params: { token: string }
}

export default function VerifyEmail({ params }: PageProps) {
  return (
    <Suspense fallback={<Loading />}>
      <VerifyEmailClient token={params.token} />
    </Suspense>
  );
} 