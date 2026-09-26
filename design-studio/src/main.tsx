import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { useStore } from './store';
import { ProjectsPage } from './components/ProjectsPage';
import { Workspace } from './components/Workspace';
import './styles.css';

function App() {
  const loaded = useStore((s) => s.loaded);
  const project = useStore((s) => s.project);
  useEffect(() => {
    useStore.getState().load();
  }, []);
  if (!loaded) return <div className="loading">Загрузка…</div>;
  return project ? <Workspace /> : <ProjectsPage />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
