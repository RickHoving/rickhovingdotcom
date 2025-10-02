import AboutWithImage from './components/AboutWithImage';
import Contact from './components/Contact';
import WorkExperience from './components/WorkExperience';

import ExperienceSummary from './components/ExperienceSummary';
import ThemeSwitch from './components/ThemeSwitch';

import styles from './App.module.scss';


function App() {

  return (
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
  );
}

export default App;
