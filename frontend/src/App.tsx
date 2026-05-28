import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Discussion from './components/Discussion';
import { AppProvider } from './context/AppContext';

function AppContent() {
  return (
    <div className="min-h-screen bg-bg-primary font-body">
      <Header />
      <div className="pt-20 flex">
        <Sidebar />
        <main className="flex-1 ml-[400px] h-[calc(100vh-5rem)] overflow-hidden p-4">
          <div className="h-full clay-card p-5 overflow-hidden">
            <Discussion />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
