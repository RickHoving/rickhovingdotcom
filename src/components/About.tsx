import React from 'react';
import styles from './About.module.scss';


const About: React.FC = () => (
  <section className={styles.about}>
    <h2>About Me</h2>
    <p>
      Lead Software Architect at Sygno, Utrecht, Netherlands.<br />
      <br />
      <strong>Keywords:</strong> Motivated, Dedicated, Hardworking, Responsible, Friendly, Polite, Helpful, Independent.<br />
      <br />
      I am passionate about web development and software architecture, with extensive experience in both frontend and backend technologies. I enjoy leading teams, innovating, and delivering high-quality solutions. My background includes architecting modern web applications, mentoring colleagues, and contributing to a positive work environment.
    </p>
  </section>
);

export default About;
