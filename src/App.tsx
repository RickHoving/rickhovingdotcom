
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AboutWithImage from './components/AboutWithImage';
import Contact from './components/Contact';
import WorkExperience from './components/WorkExperience';
import ExperienceSummary from './components/ExperienceSummary';
import ThemeSwitch from './components/ThemeSwitch';
import DndPokemonPage from './components/DndPokemonPage';
import styles from './App.module.scss';



function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/dnd-pokemon"
          element={<DndPokemonPage />}
        />
        <Route
          path="*"
          element={
            <div className={styles.container}>
              <ThemeSwitch />
              <div className={styles.content}>
                <h1 className={styles.header}>Rick Hoving</h1>
                <AboutWithImage />
                <WorkExperience />
                <ExperienceSummary />
                <Contact />
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
