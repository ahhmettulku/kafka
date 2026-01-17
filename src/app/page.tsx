'use client';

import dynamic from 'next/dynamic';

const MessageBoard = dynamic(() => import('@/components/MessageBoard'), {
  ssr: false,
});

export default function Home() {
  return <MessageBoard />;
}
