import React from 'react';
import styles from './Skills.module.scss';


const skills = [
  'Web Development',
  'JavaScript',
  'TypeScript',
  'HTML',
  'SCSS / Sass',
  'CSS',
  'AJAX',
  'C#',
  'Visual DataFlex',
  'MaquetteJs',
  'Frontend Architecture',
  'Backend Development',
  'Mentoring',
  'Team Leadership',
];

const languages = [
  'Dutch (Native or Bilingual)',
  'English (Full Professional)',
  'German (Limited Working)',
  'French (Elementary)',
  'Spanish (Elementary)',
];


const Skills: React.FC = () => (
  <section className={styles.skills}>
    <h2>Skills</h2>
    <ul>
      {skills.map((skill) => (
        <li key={skill}>{skill}</li>
      ))}
    </ul>
    <h2 style={{ marginTop: '2rem' }}>Languages</h2>
    <ul>
      {languages.map((lang) => (
        <li key={lang}>{lang}</li>
      ))}
    </ul>
  </section>
);

export default Skills;
