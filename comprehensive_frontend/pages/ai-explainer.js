import SignalExplainabilityPage from '../components/SignalExplainabilityPage';

export async function getServerSideProps({ query }) {
  const initialSymbol = typeof query.symbol === 'string' ? query.symbol : 'BTC';

  return {
    props: {
      initialSymbol,
    },
  };
}

export default function AIExplainerPage({ initialSymbol }) {
  return <SignalExplainabilityPage initialSymbol={initialSymbol} />;
}
