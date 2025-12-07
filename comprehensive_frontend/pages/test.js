export default function Test() {
  return (
    <div style={{ padding: '50px', background: '#1a1a1a', color: 'white', minHeight: '100vh' }}>
      <h1>Test Page</h1>
      <p>If you can see this, Next.js is working!</p>
      <p>Time: {new Date().toLocaleString()}</p>
    </div>
  )
}
