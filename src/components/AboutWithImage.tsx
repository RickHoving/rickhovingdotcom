import React from 'react';
import aboutStyles from './About.module.scss';
import styles from './AboutWithImage.module.scss';

const AboutWithImage: React.FC = () => (
  <section className={styles.aboutWithImage}>
    <div className={aboutStyles.about + ' ' + styles.aboutWithImageBox}>
      <div className={styles.aboutContent}>
        <h2>About Me</h2>
        <p>
          Lead Software Architect at Sygno, Utrecht, Netherlands.<br />
          <br />
          <strong>Keywords:</strong> Motivated, Dedicated, Hardworking, Responsible, Friendly, Polite, Helpful, Independent.<br />
          <br />
          I am passionate about web development and software architecture, with extensive experience in both frontend and backend technologies. I enjoy leading teams, innovating, and delivering high-quality solutions. My background includes architecting modern web applications, mentoring colleagues, and contributing to a positive work environment.
        </p>
      </div>
      <div className={styles.imageSectionInside}>
        <img
          src="/The%20Creators%20Hub%20-%20SYGNO%20-%2001817-2.jpg"
          alt="Rick Hoving profile"
          className={styles.bigProfileImage}
        />
      </div>
    </div>
  </section>
);

export default AboutWithImage;
