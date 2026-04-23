export function PriceCardSkeleton() {
  return (
    <div style={{
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '15px',
      padding: '20px',
      height: '120px'
    }}>
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div style={{ padding: '20px' }}>
      {[...Array(rows)].map((_, i) => (
        <div key={i} style={{
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          height: '60px',
          marginBottom: '10px',
          borderRadius: '8px'
        }} />
      ))}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 25%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.8) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '15px',
      padding: '25px',
      height: '100px',
      border: '2px solid rgba(255,255,255,0.3)'
    }}>
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
