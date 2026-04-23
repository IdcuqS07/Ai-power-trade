import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TradesRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/trade-history');
  }, []);
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Redirecting...</h1>
        <p>Taking you to the new Trade History page</p>
      </div>
    </div>
  );
}
