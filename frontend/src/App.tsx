import AppRouter from './routes';
import DevTools from './components/DevTools';

export default function App() {
  return (
    <>
      <AppRouter />
      <DevTools />
    </>
  );
}