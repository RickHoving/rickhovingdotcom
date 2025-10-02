import React from 'react';
import styles from './ExperienceSummary.module.scss';

const techStack = [
  'TypeScript & JavaScript (React, Node.js)',
  'C# & .NET',
  'Python (Flask, data processing, Spark)',
  'SCSS/Sass, HTML, CSS',
  'DevOps & Release Management',
  'Big Data & Distributed Systems',
  'AI & Machine Learning',
];

const ExperienceSummary: React.FC = () => (
  <section className={styles.summarySection}>
    <h2 className={styles.heading}>Professional Highlights</h2>
    <div className={styles.summaryGrid}>
      <div className={styles.summaryBlock}>
        <h3>Tech Stack</h3>
        <ul>
          {techStack.map(tech => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      </div>
      <div className={styles.summaryBlock}>
        <h3>Hands-On Experience & Achievements</h3>
        <ul>
          <li>Architected and built large-scale frontend and backend systems</li>
          <li>Extensive hands-on coding in multiple languages and frameworks</li>
          <li>Designed and implemented AI-driven and data-intensive solutions (including Spark)</li>
          <li>Developed and optimized complex algorithms for big data processing</li>
          <li>Managed release cycles, DevOps, and end-to-end delivery</li>
          <li>Direct customer contact and support, translating needs into robust solutions</li>
          <li>Mentored and led development teams, driving technical excellence</li>
        </ul>
      </div>
    </div>
  </section>
);

export default ExperienceSummary;
