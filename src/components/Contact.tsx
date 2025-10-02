import React from 'react';
import { FaEnvelope, FaLinkedin } from 'react-icons/fa';
import styles from './Contact.module.scss';


const Contact: React.FC = () => (
  <section className={styles.contact}>
    <h2>Contact</h2>
    <p>
      I’m always happy to connect with fellow professionals, recruiters, or anyone interested in tech, leadership, or collaboration.<br />
      <br />
      Whether you want to discuss a project, share ideas, or just say hello, feel free to reach out!
    </p>
    <ul className={styles.links}>
      <li>
        <a href="mailto:rickhoving7@gmail.com" className={styles.email}>
          <FaEnvelope style={{ marginRight: 8, verticalAlign: 'middle' }} /> rickhoving7@gmail.com
        </a>
      </li>
      <li>
        <a href="https://www.linkedin.com/in/hovingrick" target="_blank" rel="noopener noreferrer" className={styles.linkedin}>
          <FaLinkedin style={{ marginRight: 8, verticalAlign: 'middle' }} /> LinkedIn
        </a>
      </li>
    </ul>
    <p style={{ marginTop: 24, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
      Let’s build something great together!
    </p>
  </section>
);

export default Contact;
